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
