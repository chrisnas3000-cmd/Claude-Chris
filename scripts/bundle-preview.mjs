/**
 * Packs the built site into a single self-contained HTML file for previewing
 * and sharing. Run with `npm run preview` after a build; writes preview.html.
 *
 * This exists because the real site is a multi-page static build that needs a
 * web server. The bundle inlines the stylesheet, the script, the fonts and the
 * artwork as data URIs, and turns the page-to-page navigation into a small
 * hash router, so the whole thing works from a single file with no server and
 * no outbound requests.
 *
 * It is a preview format, not the deliverable. Deploy _site/ for production —
 * that version has real URLs, per-page titles and metadata, and a sitemap,
 * all of which a single file cannot have.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, resolve, extname } from 'node:path';

const OUT = resolve(process.cwd(), '_site');
const SRC = resolve(process.cwd(), 'src');

/* Which built pages become routes, and what each is called. */
const ROUTES = [
  { path: '/', file: 'index.html', label: 'Home' },
  { path: '/treatments/', file: 'treatments/index.html', label: 'Treatments' },
  { path: '/about/', file: 'about/index.html', label: 'About' },
  { path: '/visit/', file: 'visit/index.html', label: 'Visit' },
  { path: '/404.html', file: '404.html', label: 'Not found' },
];

/* Only the latin subset is bundled — the copy is English, and carrying every
   subset would roughly triple the font payload for no visible benefit. */
const FONT_SUBSET = /-latin\.woff2$/;

const read = (p) => readFile(p, 'utf8');
const slice = (html, tag) => {
  const open = html.indexOf(`<${tag}`);
  if (open === -1) return '';
  const start = html.indexOf('>', open) + 1;
  const end = html.lastIndexOf(`</${tag}>`);
  return html.slice(start, end);
};

/* --- fonts ---------------------------------------------------------------- */
const fontDir = join(SRC, 'assets', 'fonts');
const fontFiles = (await readdir(fontDir)).filter((f) => FONT_SUBSET.test(f));
const fontData = new Map();
for (const file of fontFiles) {
  fontData.set(file, (await readFile(join(fontDir, file))).toString('base64'));
}

let fontCss = await read(join(SRC, 'assets', 'css', 'fonts.css'));
// Drop the @font-face blocks for subsets we are not bundling, then swap the
// remaining file references for inline data URIs.
fontCss = fontCss
  .split('@font-face')
  .filter((block, i) => i === 0 || [...fontData.keys()].some((f) => block.includes(f)))
  .join('@font-face');
for (const [file, base64] of fontData) {
  fontCss = fontCss.replaceAll(
    `url('../fonts/${file}')`,
    `url('data:font/woff2;base64,${base64}')`
  );
}

/* --- artwork -------------------------------------------------------------- */
const imgDir = join(SRC, 'assets', 'img');
const imgData = new Map();
for (const file of await readdir(imgDir)) {
  const ext = extname(file);
  if (ext === '.svg') {
    const svg = await readFile(join(imgDir, file), 'utf8');
    imgData.set(`/assets/img/${file}`, `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`);
  } else if (ext === '.png') {
    const png = await readFile(join(imgDir, file));
    imgData.set(`/assets/img/${file}`, `data:image/png;base64,${png.toString('base64')}`);
  }
}
const inlineAssets = (html) => {
  let out = html;
  for (const [path, uri] of imgData) out = out.replaceAll(path, uri);
  return out;
};

/* --- shared chrome, taken from the built home page ------------------------- */
const home = await read(join(OUT, 'index.html'));
const archDefs = home.slice(home.indexOf('<svg class="sr-only"'), home.indexOf('</svg>') + 6);
const brandTokens = slice(home.slice(home.indexOf('<style>')), 'style');
const header = inlineAssets(
  home.slice(home.indexOf('<header'), home.indexOf('</header>') + 9)
);
const footer = inlineAssets(
  home.slice(home.indexOf('<footer'), home.indexOf('</footer>') + 9)
);
const bookingBar = inlineAssets(
  home.slice(home.indexOf('<div class="booking-bar"'), home.indexOf('</div>\n\n<script') + 6)
);

/* --- routes --------------------------------------------------------------- */
const seenIds = new Map();
const duplicates = [];
const sections = [];

for (const route of ROUTES) {
  const html = await read(join(OUT, route.file));
  let main = inlineAssets(slice(html, 'main'));

  // Internal links become hash routes. Anchors inside a page are folded into
  // the same scheme (/treatments/#massage -> #/treatments/massage) so the
  // router can switch the route and scroll in one step.
  main = main
    .replace(/href="\/([a-z0-9-]*\/)#([a-z0-9-]+)"/gi, 'href="#/$1$2"')
    .replace(/href="#([a-z0-9-]+)"/gi, `href="#${route.path}$1"`)
    .replace(/href="\/([a-z0-9-]*\/)"/gi, 'href="#/$1"')
    .replace(/href="\/"/g, 'href="#/"');

  for (const match of main.matchAll(/\bid="([^"]+)"/g)) {
    if (seenIds.has(match[1])) duplicates.push(`${match[1]} (${route.path} and ${seenIds.get(match[1])})`);
    else seenIds.set(match[1], route.path);
  }

  sections.push(
    `<div class="route" data-route="${route.path}" data-label="${route.label}" hidden>${main}</div>`
  );
}

if (duplicates.length) {
  console.warn(`Warning: duplicate ids across routes — ${duplicates.join(', ')}`);
}

/* --- chrome links --------------------------------------------------------- */
const routeLinks = (html) =>
  html
    .replace(/href="\/([a-z0-9-]*\/)"/gi, 'href="#/$1"')
    .replace(/href="\/"/g, 'href="#/"');

const css = await read(join(SRC, 'assets', 'css', 'style.css'));
const js = await read(join(SRC, 'assets', 'js', 'main.js'));

const page = `<title>Teena'z Spa — website concept</title>
<style>
${brandTokens}
${fontCss}
${css}

/* --- preview-only: route switching ------------------------------------- */
.route[hidden] { display: none; }
</style>

${archDefs}

${routeLinks(header)}

<main id="main">
${sections.join('\n')}
</main>

${routeLinks(footer)}
${routeLinks(bookingBar)}

<script>
${js}
</script>

<script>
/* Preview-only hash router. The deployed site uses real URLs and needs none
   of this — see README.md. */
(function () {
  var routes = Array.prototype.slice.call(document.querySelectorAll('.route'));
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('.site-nav__list a, .site-footer__nav a')
  );

  function parse(hash) {
    var raw = (hash || '').replace(/^#/, '');
    if (!raw) return { path: '/', anchor: '' };
    // "/treatments/massage" -> path "/treatments/", anchor "massage"
    var match = raw.match(/^(\\/[a-z0-9.-]*\\/?)([a-z0-9-]*)$/i);
    if (!match) return { path: '/', anchor: '' };
    var path = match[1];
    var anchor = match[2] || '';
    if (path !== '/' && !/\\/$/.test(path) && path !== '/404.html') path += '/';
    return { path: path, anchor: anchor };
  }

  // The site's own observer runs once at load, when every route except the
  // first is hidden. Hidden elements measure as zero-height at the top of the
  // page, so it treats them as on-screen, reveals them and stops watching. The
  // preview therefore needs its own observer to handle reveals on navigation.
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var watcher = 'IntersectionObserver' in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          watcher.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 })
    : null;

  function show(hash) {
    var target = parse(hash);
    var match = routes.filter(function (r) {
      return r.getAttribute('data-route') === target.path;
    })[0];
    if (!match) {
      match = routes.filter(function (r) {
        return r.getAttribute('data-route') === '/404.html';
      })[0];
    }
    if (!match) match = routes[0];

    routes.forEach(function (r) { r.hidden = r !== match; });

    var path = match.getAttribute('data-route');
    document.title = path === '/'
      ? "Teena'z Spa — Spa, massage & beauty in Achrafieh, Beirut"
      : match.getAttribute('data-label') + " · Teena'z Spa";

    navLinks.forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (href.replace(/^#/, '') === path) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    // Replay the entrance for the route being shown, rather than letting a
    // navigation land on a page of already-faded-in content.
    var revealables = match.querySelectorAll('[data-reveal]');
    Array.prototype.forEach.call(revealables, function (el) { el.classList.remove('is-in'); });

    if (target.anchor) {
      var anchored = document.getElementById(target.anchor);
      if (anchored) anchored.scrollIntoView();
      else window.scrollTo(0, 0);
    } else {
      window.scrollTo(0, 0);
    }

    // Let layout settle at the new scroll position before deciding what is on
    // screen: reveal that immediately, and hand the rest to the observer so
    // they arrive as the visitor scrolls.
    window.requestAnimationFrame(function () {
      Array.prototype.forEach.call(revealables, function (el) {
        if (reduced || !watcher || el.getBoundingClientRect().top < window.innerHeight * 1.05) {
          el.classList.add('is-in');
        } else {
          watcher.observe(el);
        }
      });
      window.dispatchEvent(new Event('scroll'));
    });
  }

  window.addEventListener('hashchange', function () { show(window.location.hash); });
  show(window.location.hash);
})();
</script>
`;

await writeFile(resolve(process.cwd(), 'preview.html'), page);

const kb = Math.round(Buffer.byteLength(page) / 1024);
console.log(`Wrote preview.html (${kb} KB, ${ROUTES.length} routes, ${fontData.size} fonts, ${imgData.size} images inlined).`);
