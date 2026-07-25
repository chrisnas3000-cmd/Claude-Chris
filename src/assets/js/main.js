/**
 * Progressive enhancement only — the site is fully readable and bookable
 * with JavaScript disabled. This adds the sticky header state, the mobile
 * menu, scroll reveals and the booking bar.
 */
(function () {
  'use strict';

  document.body.classList.remove('no-js');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Sticky header ----------------------------------------------------- */
  var header = document.querySelector('[data-header]');
  var bookingBar = document.querySelector('[data-booking-bar]');

  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-stuck', y > 40);
    // The bar appears once the hero is behind you, so it never competes
    // with the hero's own call to action.
    if (bookingBar) bookingBar.classList.toggle('is-visible', y > window.innerHeight * 0.7);
  }

  var ticking = false;
  window.addEventListener(
    'scroll',
    function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        onScroll();
        ticking = false;
      });
    },
    { passive: true }
  );
  onScroll();

  /* --- Mobile navigation -------------------------------------------------- */
  var toggle = document.querySelector('[data-nav-toggle]');
  var nav = document.getElementById('site-nav');

  function setNav(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    // Stop the page behind the overlay from scrolling.
    document.body.style.overflow = open ? 'hidden' : '';
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setNav(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setNav(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setNav(false);
        toggle.focus();
      }
    });

    // Reset when the layout crosses into the desktop breakpoint.
    var desktop = window.matchMedia('(min-width: 62rem)');
    var onBreakpoint = function (event) {
      if (event.matches) setNav(false);
    };
    if (desktop.addEventListener) desktop.addEventListener('change', onBreakpoint);
    else desktop.addListener(onBreakpoint);
  }

  /* --- Scroll reveals ----------------------------------------------------- */
  var revealables = document.querySelectorAll('[data-reveal]');

  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(revealables, function (el) {
      el.classList.add('is-in');
    });
  } else {
    Array.prototype.forEach.call(revealables, function (el) {
      var delay = el.getAttribute('data-reveal-delay');
      if (delay) el.style.setProperty('--reveal-delay', delay);
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        });
      },
      // The negative bottom margin holds a reveal back until the element is
      // properly in view rather than just clipping the edge.
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
    );

    Array.prototype.forEach.call(revealables, function (el) {
      // Anything already on screen at load is shown straight away. That same
      // negative bottom margin would otherwise leave elements sitting low in
      // the first viewport — the hero's stats among them — permanently
      // hidden, because they are never scrolled *into* view.
      if (el.getBoundingClientRect().top < window.innerHeight) {
        el.classList.add('is-in');
        return;
      }
      observer.observe(el);
    });
  }
})();
