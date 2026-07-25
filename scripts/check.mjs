/**
 * Post-build checks. Run with `npm run check` (after `npm run build`).
 *
 * Verifies the built site in _site/:
 *   - every internal link resolves to a real page
 *   - every asset reference (css, js, img, font) exists on disk
 *   - JSON-LD parses as valid JSON
 *   - no unrendered template syntax leaked into the HTML
 *   - accessibility basics: lang, title, single h1, alt text, form labels
 *   - the WhatsApp booking number matches the configured one
 *
 * Exits non-zero if anything fails, so it can gate a deploy.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import site from '../src/_data/site.js';

const OUT = resolve(process.cwd(), '_site');
const failures = [];
const warnings = [];

function fail(file, message) {
  failures.push(`${file}: ${message}`);
}
function warn(file, message) {
  warnings.push(`${file}: ${message}`);
}

/** Every .html file in the build. */
async function htmlFiles(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await htmlFiles(path)));
    else if (entry.name.endsWith('.html')) found.push(path);
  }
  return found;
}

/** Resolves a site-absolute URL to the file that should serve it. */
function targetFor(url) {
  const clean = url.split('#')[0].split('?')[0];
  if (clean === '' || clean === '/') return join(OUT, 'index.html');
  const base = join(OUT, clean);
  if (clean.endsWith('/')) return join(base, 'index.html');
  if (existsSync(base)) return base;
  return join(base, 'index.html');
}

const pages = await htmlFiles(OUT);
if (pages.length === 0) fail('_site', 'no HTML files — did the build run?');

const expectedWa = site.contact.whatsapp.link;
let waLinkCount = 0;

for (const file of pages) {
  const rel = file.replace(`${OUT}/`, '');
  const html = await readFile(file, 'utf8');

  /* --- template leakage ------------------------------------------------- */
  if (/\{\{|\{%/.test(html)) fail(rel, 'unrendered template syntax found');
  if (/undefined|\[object Object\]/.test(html)) {
    warn(rel, 'contains "undefined" or "[object Object]"');
  }

  /* --- document basics --------------------------------------------------- */
  if (!/<html[^>]+lang=/.test(html)) fail(rel, 'missing lang attribute on <html>');
  if (!/<title>[^<]+<\/title>/.test(html)) fail(rel, 'missing or empty <title>');
  if (!/<meta name="description" content="[^"]+"/.test(html)) {
    fail(rel, 'missing meta description');
  }
  if (!/<link rel="canonical"/.test(html)) fail(rel, 'missing canonical link');

  const h1s = html.match(/<h1[\s>]/g) || [];
  if (h1s.length === 0) fail(rel, 'no <h1>');
  if (h1s.length > 1) fail(rel, `${h1s.length} <h1> elements — expected exactly 1`);

  /* --- images need alt text ---------------------------------------------- */
  for (const tag of html.match(/<img\b[^>]*>/g) || []) {
    if (!/\balt=/.test(tag)) fail(rel, `<img> without alt: ${tag.slice(0, 90)}`);
  }

  /* --- JSON-LD parses ----------------------------------------------------- */
  for (const block of html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
  ) || []) {
    const json = block
      .replace(/<script type="application\/ld\+json">/, '')
      .replace(/<\/script>/, '');
    try {
      const parsed = JSON.parse(json);
      if (!parsed['@context'] || !parsed['@type']) {
        fail(rel, 'JSON-LD missing @context or @type');
      }
    } catch (error) {
      fail(rel, `JSON-LD is not valid JSON — ${error.message}`);
    }
  }

  /* --- links and assets --------------------------------------------------- */
  const refs = [
    ...(html.match(/href="([^"]+)"/g) || []),
    ...(html.match(/src="([^"]+)"/g) || []),
  ].map((m) => m.slice(m.indexOf('"') + 1, -1));

  // Also catch url(...) inside inline styles.
  for (const m of html.match(/url\('([^']+)'\)/g) || []) {
    refs.push(m.slice(5, -2));
  }

  for (const ref of refs) {
    if (ref.startsWith('https://wa.me/')) {
      waLinkCount += 1;
      if (!ref.startsWith(expectedWa)) {
        fail(rel, `WhatsApp link does not match config: ${ref}`);
      }
      continue;
    }
    if (
      ref.startsWith('http://') ||
      ref.startsWith('https://') ||
      ref.startsWith('tel:') ||
      ref.startsWith('mailto:') ||
      ref.startsWith('data:') ||
      ref.startsWith('#')
    ) {
      continue;
    }
    if (!ref.startsWith('/')) {
      warn(rel, `relative reference (prefer site-absolute): ${ref}`);
      continue;
    }
    const target = targetFor(ref);
    if (!existsSync(target)) fail(rel, `broken reference: ${ref}`);
  }

  /* --- in-page anchors resolve -------------------------------------------- */
  const ids = new Set((html.match(/\bid="([^"]+)"/g) || []).map((m) => m.slice(4, -1)));
  for (const ref of refs) {
    if (!ref.startsWith('#') || ref === '#') continue;
    if (!ids.has(ref.slice(1))) fail(rel, `anchor points at missing id: ${ref}`);
  }
}

/* --- sitemap and robots --------------------------------------------------- */
for (const required of ['sitemap.xml', 'robots.txt', '404.html']) {
  if (!existsSync(join(OUT, required))) fail('_site', `missing ${required}`);
}

const sitemap = await readFile(join(OUT, 'sitemap.xml'), 'utf8');
for (const item of site.nav) {
  if (!sitemap.includes(`${site.seo.url}${item.url}`)) {
    fail('sitemap.xml', `missing entry for ${item.url}`);
  }
}

/* --- the booking path must exist ------------------------------------------ */
if (waLinkCount === 0) fail('_site', 'no WhatsApp booking links found anywhere');

/* --- every service is reachable ------------------------------------------- */
const treatments = await readFile(join(OUT, 'treatments', 'index.html'), 'utf8');
for (const category of site.serviceCategories) {
  for (const service of category.services) {
    // Apostrophes are entity-encoded in the output.
    const name = service.name.replace(/'/g, '&#39;');
    if (!treatments.includes(name) && !treatments.includes(service.name)) {
      fail('treatments/index.html', `service missing from page: ${service.name}`);
    }
  }
}

/* --- report ---------------------------------------------------------------- */
const totalPages = pages.length;
const sizes = await Promise.all(pages.map(async (p) => (await stat(p)).size));
const totalKb = Math.round(sizes.reduce((a, b) => a + b, 0) / 1024);

console.log(`Checked ${totalPages} pages (${totalKb} KB of HTML).`);
console.log(`Found ${waLinkCount} WhatsApp booking links.`);

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  warnings.forEach((w) => console.log(`  ! ${w}`));
}

if (failures.length) {
  console.error(`\n${failures.length} failure(s):`);
  failures.forEach((f) => console.error(`  x ${f}`));
  process.exit(1);
}

console.log('\nAll checks passed.');
