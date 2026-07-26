/**
 * Progressive enhancement for the content site.
 *
 * The site is fully readable and bookable with JavaScript disabled — this
 * adds the sticky header state, the mobile drawer, scroll reveals and the
 * booking bar.
 */
(function () {
  'use strict';

  document.body.classList.remove('no-js');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Sticky header and booking bar -------------------------------------- */
  var header = document.querySelector('[data-header]');
  var bookingBar = document.querySelector('[data-booking-bar]');

  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-stuck', y > 24);
    // The bar appears once the hero is behind you, so it never competes with
    // the hero's own call to action.
    if (bookingBar) bookingBar.classList.toggle('is-visible', y > window.innerHeight * 0.7);
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      onScroll();
      ticking = false;
    });
  }, { passive: true });
  onScroll();

  /* --- Mobile drawer ------------------------------------------------------ */
  var drawer = document.querySelector('[data-drawer]');
  var toggles = document.querySelectorAll('[data-nav-toggle]');

  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle('is-open', open);
    Array.prototype.forEach.call(toggles, function (t) {
      t.setAttribute('aria-expanded', String(open));
    });
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      var first = drawer.querySelector('a, button');
      if (first) first.focus();
    }
  }

  Array.prototype.forEach.call(toggles, function (toggle) {
    toggle.addEventListener('click', function () {
      setDrawer(toggle.getAttribute('aria-expanded') !== 'true');
    });
  });

  if (drawer) {
    drawer.addEventListener('click', function (event) {
      if (event.target.closest('a')) setDrawer(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && drawer.classList.contains('is-open')) {
        setDrawer(false);
        if (toggles[0]) toggles[0].focus();
      }
    });
    var desktop = window.matchMedia('(min-width: 62rem)');
    var onBreak = function (e) { if (e.matches) setDrawer(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onBreak);
    else desktop.addListener(onBreak);
  }

  /* --- Hero video ---------------------------------------------------------
     The markup ships with no <source> and preload="none", so nothing is
     downloaded until this decides the video is worth fetching. If it never
     runs — no JavaScript, an old browser, a refused autoplay — the poster
     image underneath is already a finished hero.
  */
  (function heroVideo() {
    var video = document.querySelector('[data-hero-video]');
    if (!video) return;

    // Reasons not to spend the visitor's bandwidth or override their settings.
    var connection = navigator.connection || {};
    var slow = /(^|-)2g$/.test(connection.effectiveType || '');
    if (reduced || connection.saveData === true || slow) return;

    function attach() {
      [
        { src: video.getAttribute('data-webm'), type: 'video/webm' },
        { src: video.getAttribute('data-mp4'), type: 'video/mp4' },
      ].forEach(function (item) {
        if (!item.src) return;
        var source = document.createElement('source');
        source.src = item.src;
        source.type = item.type;
        video.appendChild(source);
      });

      // Only reveal the video once frames are genuinely rendering. Fading in
      // on `canplay` alone can show a black box for a beat on slower devices.
      video.addEventListener('playing', function () {
        video.classList.add('is-playing');
      }, { once: true });

      video.load();
      var attempt = video.play();
      // Autoplay can still be refused; the poster simply stays.
      if (attempt && typeof attempt.catch === 'function') attempt.catch(function () {});
    }

    // Wait until the browser is idle so the video never competes with the
    // fonts, the stylesheet or the poster for the first paint.
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(attach, { timeout: 2500 });
    } else {
      window.addEventListener('load', function () { setTimeout(attach, 400); });
    }

    // Stop playback while the tab is hidden — no reason to decode frames
    // nobody is looking at.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) video.pause();
      else if (video.classList.contains('is-playing')) {
        var resume = video.play();
        if (resume && typeof resume.catch === 'function') resume.catch(function () {});
      }
    });
  })();

  /* --- Service card videos ------------------------------------------------
     Same gates as the hero, plus one more: nothing is fetched until the card
     is actually near the viewport. Three clips below the fold should not cost
     anything to a visitor who never scrolls that far.
  */
  (function cardVideos() {
    var cards = document.querySelectorAll('[data-card-video]');
    if (!cards.length) return;

    var connection = navigator.connection || {};
    var slow = /(^|-)2g$/.test(connection.effectiveType || '');
    if (reduced || connection.saveData === true || slow) return;

    function start(video) {
      if (video.dataset.started) return;
      video.dataset.started = '1';

      [
        { src: video.getAttribute('data-webm'), type: 'video/webm' },
        { src: video.getAttribute('data-mp4'), type: 'video/mp4' },
      ].forEach(function (item) {
        if (!item.src) return;
        var source = document.createElement('source');
        source.src = item.src;
        source.type = item.type;
        video.appendChild(source);
      });

      video.addEventListener('playing', function () {
        video.classList.add('is-playing');
      }, { once: true });

      video.load();
      var attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') attempt.catch(function () {});
    }

    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(cards, start);
      return;
    }

    // A generous margin so the clip is already running by the time the card is
    // properly on screen, rather than visibly starting under the visitor.
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var video = entry.target;
        if (entry.isIntersecting) {
          start(video);
          if (video.paused && video.dataset.started) {
            var resume = video.play();
            if (resume && typeof resume.catch === 'function') resume.catch(function () {});
          }
        } else if (!video.paused) {
          // Off screen: stop decoding frames nobody can see.
          video.pause();
        }
      });
    }, { rootMargin: '300px 0px' });

    Array.prototype.forEach.call(cards, function (video) { observer.observe(video); });
  })();

  /* --- Scroll reveals ----------------------------------------------------- */
  var revealables = document.querySelectorAll('[data-reveal]');

  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('is-in'); });
  } else {
    Array.prototype.forEach.call(revealables, function (el) {
      var delay = el.getAttribute('data-reveal-delay');
      if (delay) el.style.setProperty('--reveal-delay', delay);
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

    Array.prototype.forEach.call(revealables, function (el) {
      // Anything already on screen at load shows straight away — the negative
      // bottom margin would otherwise strand elements low in the first
      // viewport, which are never scrolled *into* view.
      if (el.getBoundingClientRect().top < window.innerHeight) {
        el.classList.add('is-in');
        return;
      }
      observer.observe(el);
    });
  }
})();
