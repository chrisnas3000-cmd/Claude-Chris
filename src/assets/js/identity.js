/**
 * Behaviour for the identity system pages.
 * Progressive enhancement only — everything is readable without it.
 */
(function () {
  'use strict';

  document.body.classList.remove('no-js');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Sticky header and floating action button -------------------------- */
  var header = document.querySelector('[data-header]');
  var fab = document.querySelector('[data-fab]');

  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-stuck', y > 24);
    // Appears only once there is somewhere to go back to.
    if (fab) fab.classList.toggle('is-visible', y > window.innerHeight * 0.8);
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

  /* --- Accordion ---------------------------------------------------------- */
  var triggers = document.querySelectorAll('[data-accordion-trigger]');
  Array.prototype.forEach.call(triggers, function (trigger) {
    trigger.addEventListener('click', function () {
      var panel = document.getElementById(trigger.getAttribute('aria-controls'));
      var open = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!open));
      if (panel) panel.setAttribute('data-open', String(!open));
    });
  });

  /* --- Scroll reveals ----------------------------------------------------- */
  var revealables = document.querySelectorAll('[data-reveal]');

  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('is-in'); });
  } else {
    Array.prototype.forEach.call(revealables, function (el) {
      var delay = el.getAttribute('data-reveal-delay');
      if (delay) el.style.setProperty('--reveal-delay', delay);
    });

    var pending = [];

    function reveal(el) {
      el.classList.add('is-in');
      var at = pending.indexOf(el);
      if (at !== -1) pending.splice(at, 1);
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

    Array.prototype.forEach.call(revealables, function (el) {
      // Anything already on screen shows immediately; the negative bottom
      // margin would otherwise strand elements low in the first viewport.
      if (el.getBoundingClientRect().top < window.innerHeight) {
        el.classList.add('is-in');
        return;
      }
      pending.push(el);
      observer.observe(el);
    });

    /*
      Safety net. The observer's negative bottom margin leaves a band near the
      foot of the viewport that a fast or jumped scroll can cross without ever
      producing an intersection. Anything scrolled past but still hidden is
      caught here, so no heading is left invisible.
    */
    window.addEventListener('scroll', function () {
      if (!pending.length) return;
      for (var i = pending.length - 1; i >= 0; i -= 1) {
        var el = pending[i];
        if (el.getBoundingClientRect().top < window.innerHeight) {
          observer.unobserve(el);
          reveal(el);
        }
      }
    }, { passive: true });
  }
})();
