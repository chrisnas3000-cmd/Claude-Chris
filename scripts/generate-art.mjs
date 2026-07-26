/**
 * Generates the two image assets that cannot be drawn in the browser:
 * the favicon and the social link-preview card.
 *
 * Everything else on the site is either a real photograph or a placeholder
 * frame painted at runtime (see src/assets/js/placeholder-media.js). These two
 * have to be static files — a favicon is fetched before any script runs, and
 * WhatsApp reads the preview image from the markup without loading the page.
 *
 * Colours come from src/_data/site.js, so a rebrand carries through here too.
 * Run with `npm run art`; `npm run raster` then converts share.svg to PNG.
 */
import { mkdir, writeFile, readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import site from '../src/_data/site.js';

const C = site.brand.colors;
const OUT = join(process.cwd(), 'src', 'assets', 'img');

const escapeXml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/* The identity mark: a soft leaf form inside a ring. */
function mark(stroke, opacity = 1) {
  return `
  <circle cx="16" cy="16" r="15" fill="none" stroke="${stroke}" stroke-width="1" opacity="${opacity}"/>
  <path d="M16 6c4.4 3.2 6.6 6.6 6.6 10a6.6 6.6 0 0 1-13.2 0C9.4 12.6 11.6 9.2 16 6Z"
        fill="none" stroke="${stroke}" stroke-width="1.3"/>
  <path d="M16 12v9" fill="none" stroke="${stroke}" stroke-width="1.3" opacity="0.55"/>`;
}

function favicon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="64" height="64" role="img" aria-label="${escapeXml(site.business.name)}">
  <rect width="32" height="32" rx="7" fill="${C.ivory}"/>
  <g transform="translate(0.6 0.6) scale(0.9625)">${mark(C.bronze)}</g>
</svg>`;
}

/**
 * The link-preview card, 1200x630. Warm ivory ground, espresso type, a single
 * bronze rule — the same restraint the rest of the identity uses.
 */
function share() {
  const w = 1200;
  const h = 630;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${escapeXml(site.images.share.alt)}">
  <defs>
    <linearGradient id="ground" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.white}"/>
      <stop offset="62%" stop-color="${C.ivory}"/>
      <stop offset="100%" stop-color="${C.sand}"/>
    </linearGradient>
    <radialGradient id="glow" cx="82%" cy="26%" r="62%">
      <stop offset="0%" stop-color="${C.bronze}" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="${C.ivory}" stop-opacity="0"/>
    </radialGradient>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="5"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.22"/></feComponentTransfer>
    </filter>
  </defs>

  <rect width="${w}" height="${h}" fill="url(#ground)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>

  <g transform="translate(96 92) scale(2.2)">${mark(C.bronze)}</g>

  <text x="96" y="300" font-family="Georgia, 'Times New Roman', serif" font-size="82"
        fill="${C.espresso}">${escapeXml(site.business.name)}</text>
  <text x="96" y="356" font-family="Helvetica, Arial, sans-serif" font-size="24"
        letter-spacing="4" fill="${C.bronzeInk}">${escapeXml(site.business.tagline.toUpperCase())}</text>

  <line x1="96" y1="404" x2="300" y2="404" stroke="${C.bronze}" stroke-width="2" opacity="0.7"/>

  <text x="96" y="462" font-family="Helvetica, Arial, sans-serif" font-size="25"
        fill="${C.espressoSoft}">${escapeXml(site.contact.address.lines.join(' · '))}</text>
  <text x="96" y="502" font-family="Helvetica, Arial, sans-serif" font-size="25"
        fill="${C.espressoSoft}">Open until 11 PM, seven days a week</text>

  <rect width="${w}" height="${h}" filter="url(#grain)" opacity="0.5" style="mix-blend-mode:multiply"/>
</svg>`;
}

/* --- write, and clear out anything this script no longer produces --------- */
const files = { 'favicon.svg': favicon(), 'share.svg': share() };
const keep = new Set([...Object.keys(files), 'share.png', 'apple-touch-icon.png']);

await mkdir(OUT, { recursive: true });
for (const [name, contents] of Object.entries(files)) {
  await writeFile(join(OUT, name), contents);
}

// Stale artwork from a previous visual direction would otherwise sit in the
// build forever, since nothing references it any more.
let removed = 0;
for (const name of await readdir(OUT)) {
  if (keep.has(name)) continue;
  await unlink(join(OUT, name));
  removed += 1;
}

console.log(`Generated ${Object.keys(files).length} assets -> src/assets/img/`);
if (removed) console.log(`Removed ${removed} unused file(s) from a previous direction.`);
