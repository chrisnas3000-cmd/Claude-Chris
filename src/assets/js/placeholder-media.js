/**
 * Paints placeholder image fields.
 *
 * These are not pretend photographs. Each one is a soft, out-of-focus field
 * in the brand's warm grade — enough to show how the palette behaves at
 * image scale, how type sits over a scrim, and how a grid of images reads
 * together, without asserting a picture that does not exist yet.
 *
 * Every frame is labelled with the shot it stands in for, so the markup
 * doubles as the photography brief.
 *
 * Usage:  <canvas data-media="towels" data-tone="warm" aria-hidden="true"></canvas>
 */
(function () {
  'use strict';

  // Sampled from the identity palette. Each tone is a plausible warm grade:
  // an ivory-to-espresso range with a single dominant light source.
  var TONES = {
    warm:   { base: '#E8DCCB', lights: ['#FBF4E9', '#DCC6AB'], shade: '#7E6752' },
    bronze: { base: '#C9A987', lights: ['#F1DCC2', '#B98C63'], shade: '#6B4B33' },
    sage:   { base: '#B9BFB0', lights: ['#E6E7DC', '#98A28D'], shade: '#4E5749' },
    deep:   { base: '#6A574A', lights: ['#B79madeup', '#8C7259'], shade: '#29211D' },
    steam:  { base: '#DCD8CE', lights: ['#FFFDFC', '#C4BCAE'], shade: '#8A8175' },
    stone:  { base: '#CFC6BA', lights: ['#EFE8DD', '#A99C8C'], shade: '#5C5347' },
  };
  // Guard against a typo'd colour silently painting nothing.
  TONES.deep.lights[0] = '#B7936E';

  /** Deterministic pseudo-random, so a frame looks identical on every load. */
  function seeded(seed) {
    var s = 0;
    for (var i = 0; i < seed.length; i += 1) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function paint(canvas) {
    var tone = TONES[canvas.getAttribute('data-tone')] || TONES.warm;
    var rand = seeded(canvas.getAttribute('data-media') || 'placeholder');

    var rect = canvas.getBoundingClientRect();
    var w = Math.max(1, Math.round(rect.width));
    var h = Math.max(1, Math.round(rect.height));
    // Painted at a low internal resolution and scaled up by the browser —
    // the blur is the point, and it keeps these effectively free.
    var scale = 0.25;
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));

    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var cw = canvas.width;
    var ch = canvas.height;

    ctx.fillStyle = tone.base;
    ctx.fillRect(0, 0, cw, ch);

    // A dominant soft light source, placed off-centre.
    var lx = (0.2 + rand() * 0.5) * cw;
    var ly = (0.1 + rand() * 0.4) * ch;
    var key = ctx.createRadialGradient(lx, ly, 0, lx, ly, Math.max(cw, ch) * 0.95);
    key.addColorStop(0, tone.lights[0]);
    key.addColorStop(0.45, tone.lights[1]);
    key.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = key;
    ctx.fillRect(0, 0, cw, ch);

    // Out-of-focus forms. Large, overlapping, low contrast — the shapes a
    // shallow depth of field leaves behind.
    var blobs = 5 + Math.floor(rand() * 3);
    for (var i = 0; i < blobs; i += 1) {
      var bx = rand() * cw;
      var by = (0.25 + rand() * 0.85) * ch;
      var br = (0.18 + rand() * 0.42) * Math.max(cw, ch);
      var colour = i % 2 === 0 ? tone.lights[1] : tone.shade;
      var g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      g.addColorStop(0, colour);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.16 + rand() * 0.2;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Shadow gathering at the base, so frames have weight and text laid over
    // the lower edge always has something to sit on.
    var floor = ctx.createLinearGradient(0, ch * 0.45, 0, ch);
    floor.addColorStop(0, 'rgba(0,0,0,0)');
    floor.addColorStop(1, tone.shade);
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = floor;
    ctx.fillRect(0, 0, cw, ch);
    ctx.globalAlpha = 1;
  }

  /*
    A frame is painted whenever it actually has a size, rather than at a moment
    we guess layout is finished. A canvas inside a hidden container measures
    zero; painting it then produces an empty frame that never recovers. This
    matters when a frame's container is revealed later — a tab, a route change,
    an image area that only sizes once its aspect-ratio resolves.
  */
  var painted = new WeakMap();

  function paintIfSized(canvas) {
    var rect = canvas.getBoundingClientRect();
    var w = Math.round(rect.width);
    var h = Math.round(rect.height);
    if (w < 2 || h < 2) return;
    var last = painted.get(canvas);
    if (last && last.w === w && last.h === h) return;
    painted.set(canvas, { w: w, h: h });
    paint(canvas);
  }

  function paintAll() {
    Array.prototype.forEach.call(document.querySelectorAll('canvas[data-media]'), paintIfSized);
  }

  if ('ResizeObserver' in window) {
    var observer = new ResizeObserver(function (entries) {
      entries.forEach(function (entry) { paintIfSized(entry.target); });
    });
    var attach = function () {
      Array.prototype.forEach.call(
        document.querySelectorAll('canvas[data-media]'),
        function (canvas) { observer.observe(canvas); }
      );
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach);
    else attach();
  } else {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paintAll);
    else paintAll();
    var timer;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(paintAll, 200);
    });
  }

  window.paintPlaceholderMedia = paintAll;
})();
