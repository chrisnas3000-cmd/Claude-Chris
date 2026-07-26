/**
 * Packs the visual identity system into a single self-contained HTML file.
 * Run with `npm run preview:identity` after a build; writes identity.html.
 *
 * Same idea as scripts/bundle-preview.mjs, but for the identity pages, which
 * have their own layout, stylesheet, script and typefaces. Everything is
 * inlined as data URIs and page navigation becomes a hash router, so the
 * system can be opened and browsed from one file with no server.
 *
 * A preview format, not the deliverable — deploy _site/ for the real pages.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const OUT = resolve(process.cwd(), '_site');
const SRC = resolve(process.cwd(), 'src');

const ROUTES = [
  { path: '/identity/', file: 'identity/index.html', label: 'Foundations' },
  { path: '/identity/components/', file: 'identity/components/index.html', label: 'Components' },
  { path: '/identity/imagery/', file: 'identity/imagery/index.html', label: 'Imagery & motion' },
  { path: '/identity/applied/', file: 'identity/applied/index.html', label: 'Applied page' },
];

/* Only the faces this system uses, latin subset only. Carrying the content
   site's Marcellus and Jost as well would double the payload for nothing. */
const FONT_FILES = /^(cormorant-garamond|manrope)-.*-latin\.woff2$/;

const read = (p) => readFile(p, 'utf8');
const between = (html, startMark, endMark, endOffset) => {
  const a = html.indexOf(startMark);
  if (a === -1) return '';
  const b = html.indexOf(endMark, a);
  return b === -1 ? '' : html.slice(a, b + endOffset);
};

/* --- fonts ---------------------------------------------------------------- */
const fontDir = join(SRC, 'assets', 'fonts');
const fontFiles = (await readdir(fontDir)).filter((f) => FONT_FILES.test(f));
let fontCss = await read(join(SRC, 'assets', 'css', 'fonts-identity.css'));

fontCss = fontCss
  .split('@font-face')
  .filter((block, i) => i === 0 || fontFiles.some((f) => block.includes(f)))
  .join('@font-face');

for (const file of fontFiles) {
  const base64 = (await readFile(join(fontDir, file))).toString('base64');
  fontCss = fontCss.replaceAll(
    `url('../fonts/${file}')`,
    `url('data:font/woff2;base64,${base64}')`
  );
}

/* --- shared chrome -------------------------------------------------------- */
const first = await read(join(OUT, ROUTES[0].file));
const header = between(first, '<header class="header"', '</header>', 9);
const drawer = between(first, '<div class="drawer"', '\n</div>', 7);
const footer = between(first, '<footer class="footer"', '</footer>', 9);
const fab = between(first, '<a class="fab"', '</a>', 4);

/* --- routes --------------------------------------------------------------- */
const seen = new Map();
const duplicates = [];
const sections = [];

for (const route of ROUTES) {
  const html = await read(join(OUT, route.file));
  let main = between(html, '<main id="main">', '</main>', 7)
    .replace('<main id="main">', '')
    .replace('</main>', '');

  // Internal links become hash routes; in-page anchors fold into the same
  // scheme so the router can switch route and scroll in one step.
  main = main
    .replace(/href="\/identity\/([a-z-]*\/?)#([a-z0-9-]+)"/gi, 'href="#/identity/$1$2"')
    .replace(/href="#([a-z0-9-]+)"/gi, `href="#${route.path}$1"`)
    .replace(/href="\/identity\/([a-z-]*\/)"/gi, 'href="#/identity/$1"')
    .replace(/href="\/identity\/"/g, 'href="#/identity/"');

  for (const m of main.matchAll(/\bid="([^"]+)"/g)) {
    if (seen.has(m[1])) duplicates.push(`${m[1]} (${route.path} & ${seen.get(m[1])})`);
    else seen.set(m[1], route.path);
  }

  sections.push(
    `<div class="route" data-route="${route.path}" data-label="${route.label}" hidden>${main}</div>`
  );
}

if (duplicates.length) console.warn(`Warning: duplicate ids — ${duplicates.join(', ')}`);

const routeLinks = (html) =>
  html
    .replace(/href="\/identity\/([a-z-]*\/)"/gi, 'href="#/identity/$1"')
    .replace(/href="\/identity\/"/g, 'href="#/identity/"');

const css = await read(join(SRC, 'assets', 'css', 'identity.css'));
const mediaJs = await read(join(SRC, 'assets', 'js', 'placeholder-media.js'));
const js = await read(join(SRC, 'assets', 'js', 'identity.js'));

const page = `<title>Teenaz Spa — Visual Identity System</title>
<style>
${fontCss}
${css}

/* preview-only */
.route[hidden] { display: none; }
</style>

${routeLinks(header)}
${routeLinks(drawer)}

<main id="main">
${sections.join('\n')}
</main>

${routeLinks(footer)}
${routeLinks(fab)}

<script>
${mediaJs}
</script>
<script>
${js}
</script>

<script>
/* Preview-only hash router. The deployed pages use real URLs. */
(function () {
  var routes = Array.prototype.slice.call(document.querySelectorAll('.route'));
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__link, .drawer__link'));

  function parse(hash) {
    var raw = (hash || '').replace(/^#/, '');
    if (!raw) return { path: '/identity/', anchor: '' };
    var m = raw.match(/^(\\/identity\\/[a-z-]*\\/?)([a-z0-9-]*)$/i);
    if (!m) return { path: '/identity/', anchor: '' };
    var path = m[1];
    if (!/\\/$/.test(path)) path += '/';
    return { path: path, anchor: m[2] || '' };
  }

  // The identity script's observer runs once at load, when every route but the
  // first is hidden. Hidden elements measure as zero-height at the top of the
  // page, so it reveals them and stops watching — leaving later routes with
  // content that never appears on scroll. The preview needs its own.
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var watcher = 'IntersectionObserver' in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-in');
          watcher.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 })
    : null;

  function show(hash) {
    var target = parse(hash);
    var match = routes.filter(function (r) {
      return r.getAttribute('data-route') === target.path;
    })[0] || routes[0];

    routes.forEach(function (r) { r.hidden = r !== match; });

    var path = match.getAttribute('data-route');
    document.title = match.getAttribute('data-label') + ' · Teenaz Spa Visual Identity';

    links.forEach(function (a) {
      var href = (a.getAttribute('href') || '').replace(/^#/, '');
      if (href === path) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    var revealables = match.querySelectorAll('[data-reveal]');
    Array.prototype.forEach.call(revealables, function (el) { el.classList.remove('is-in'); });

    if (target.anchor) {
      var el = document.getElementById(target.anchor);
      if (el) el.scrollIntoView(); else window.scrollTo(0, 0);
    } else {
      window.scrollTo(0, 0);
    }

    window.requestAnimationFrame(function () {
      Array.prototype.forEach.call(revealables, function (el) {
        if (reduced || !watcher || el.getBoundingClientRect().top < window.innerHeight * 1.05) {
          el.classList.add('is-in');
        } else {
          watcher.observe(el);
        }
      });
      // The placeholder frames size themselves from layout, so they can only
      // be painted once their route is actually visible.
      if (window.paintPlaceholderMedia) window.paintPlaceholderMedia();
      window.dispatchEvent(new Event('scroll'));
    });
  }

  window.addEventListener('hashchange', function () { show(window.location.hash); });
  show(window.location.hash);
})();
</script>
`;

await writeFile(resolve(process.cwd(), 'identity.html'), page);
console.log(
  `Wrote identity.html (${Math.round(Buffer.byteLength(page) / 1024)} KB, ` +
  `${ROUTES.length} routes, ${fontFiles.length} fonts inlined).`
);
