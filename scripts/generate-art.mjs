/**
 * Generates the site's placeholder artwork as SVG.
 *
 * Every shape and gradient is derived from the palette in src/_data/site.js,
 * so changing a brand colour there restyles the artwork too. Run with:
 *
 *   npm run art
 *
 * These files are stand-ins for real photography. To replace one, drop a
 * photo into src/assets/img/ and point the matching entry in site.js at it —
 * you do not need to delete the SVGs or touch this script.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import site from '../src/_data/site.js';

const C = site.brand.colors;
const OUT = join(process.cwd(), 'src', 'assets', 'img');

/* ---------------------------------------------------------------------------
 * Shared pieces
 * ------------------------------------------------------------------------ */

/** A Moorish pointed arch, drawn as a closed path. */
function archPath(w, h, springline = h * 0.52) {
  const half = w / 2;
  return [
    `M 0 ${h}`,
    `L 0 ${springline}`,
    `C 0 ${springline * 0.34}, ${w * 0.19} 0, ${half} 0`,
    `C ${w * 0.81} 0, ${w} ${springline * 0.34}, ${w} ${springline}`,
    `L ${w} ${h}`,
    'Z',
  ].join(' ');
}

/** Soft drifting haze. Used for steam in the dark scenes. */
function steamFilter(id, freq = '0.010 0.024', octaves = 4) {
  return `
    <filter id="${id}" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${octaves}" seed="7" result="noise"/>
      <feGaussianBlur in="noise" stdDeviation="6" result="soft"/>
      <feColorMatrix in="soft" type="matrix"
        values="0 0 0 0 0.91
                0 0 0 0 0.89
                0 0 0 0 0.84
                0 0 0 0.55 -0.06"/>
    </filter>`;
}

/** Fine tooth, so large flat fills read as plaster rather than as flat colour. */
function grainFilter(id, opacity = 0.5) {
  return `
    <filter id="${id}" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="3" result="g"/>
      <feColorMatrix in="g" type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="${opacity}"/></feComponentTransfer>
    </filter>`;
}

function svg(w, h, body, extra = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" ${extra}>
${body}
</svg>`;
}

/* ---------------------------------------------------------------------------
 * hero — an arch opening onto light, with steam
 * ------------------------------------------------------------------------ */
function hero() {
  const w = 1600;
  const h = 1100;
  const aw = 500;
  const ah = 720;
  // Sits right of centre so the headline, which is set left, has clear ground
  // to stand on. Centred, the arch and the type fought each other.
  const ax = w * 0.63 - aw / 2;
  const ay = h - ah - 40;

  return svg(
    w,
    h,
    `
  <defs>
    <linearGradient id="room" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.noir}"/>
      <stop offset="52%" stop-color="${C.jade}"/>
      <stop offset="100%" stop-color="${C.noir}"/>
    </linearGradient>
    <radialGradient id="glow" cx="63%" cy="62%" r="48%">
      <stop offset="0%" stop-color="${C.brass}" stop-opacity="0.34"/>
      <stop offset="55%" stop-color="${C.brass}" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="${C.noir}" stop-opacity="0"/>
    </radialGradient>
    <!-- Warm and low, not bright: the headline is set over this, so the
         opening has to read as a glow rather than as a lit panel. -->
    <linearGradient id="doorway" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.brass}" stop-opacity="0.30"/>
      <stop offset="38%" stop-color="${C.brass}" stop-opacity="0.46"/>
      <stop offset="74%" stop-color="${C.clay}" stop-opacity="0.40"/>
      <stop offset="100%" stop-color="${C.brassDeep}" stop-opacity="0.34"/>
    </linearGradient>
    <linearGradient id="wallL" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${C.noir}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${C.noir}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.brassHi}" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="${C.brassHi}" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="archClip">
      <path d="${archPath(aw, ah)}" transform="translate(${ax} ${ay})"/>
    </clipPath>
    ${steamFilter('steam')}
    ${grainFilter('grain', 0.34)}
  </defs>

  <rect width="${w}" height="${h}" fill="url(#room)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>

  <!-- the lit doorway -->
  <g clip-path="url(#archClip)">
    <rect x="${ax}" y="${ay}" width="${aw}" height="${ah}" fill="url(#doorway)"/>
    <rect x="${ax}" y="${ay}" width="${aw}" height="${ah}" filter="url(#steam)" opacity="0.55"/>
    <!-- steam curling through the opening -->
    <ellipse cx="${ax + aw / 2}" cy="${ay + ah * 0.70}" rx="${aw * 0.46}" ry="${ah * 0.24}"
             fill="#FFF6E2" fill-opacity="0.12"/>
  </g>

  <!-- arch surround, drawn firmly so the shape is unmistakable -->
  <path d="${archPath(aw, ah)}" transform="translate(${ax} ${ay})"
        fill="none" stroke="${C.brassHi}" stroke-opacity="0.95" stroke-width="4"/>
  <path d="${archPath(aw + 44, ah + 34)}" transform="translate(${ax - 22} ${ay - 34})"
        fill="none" stroke="${C.brassHi}" stroke-opacity="0.30" stroke-width="1.8"/>
  <path d="${archPath(aw + 88, ah + 68)}" transform="translate(${ax - 44} ${ay - 68})"
        fill="none" stroke="${C.brassHi}" stroke-opacity="0.12" stroke-width="1.4"/>

  <!-- the wall the arch is cut into, closing in from both sides -->
  <rect x="0" y="0" width="${ax - 70}" height="${h}" fill="url(#wallL)"/>
  <rect x="0" y="0" width="${w - (ax + aw) - 70}" height="${h}" fill="url(#wallL)"
        transform="translate(${w}, 0) scale(-1, 1)"/>

  <!-- floor line and the light spilling across it -->
  <ellipse cx="${ax + aw / 2}" cy="${ay + ah}" rx="${aw * 0.98}" ry="70" fill="url(#floor)"/>
  <line x1="0" y1="${ay + ah}" x2="${w}" y2="${ay + ah}"
        stroke="${C.brass}" stroke-opacity="0.22" stroke-width="1.5"/>

  <!-- steam through the room -->
  <rect width="${w}" height="${h}" filter="url(#steam)" opacity="0.22"/>
  <rect width="${w}" height="${h}" filter="url(#grain)" opacity="0.26"/>
`,
    'aria-label="A lit archway leading into a steam room"'
  );
}

/* ---------------------------------------------------------------------------
 * hammam — zellige tilework, eight-pointed stars
 * ------------------------------------------------------------------------ */
function hammam() {
  const size = 1200;
  const step = 150;

  // One eight-pointed star (khatim), centred on the origin.
  const star = (r) => {
    const pts = [];
    for (let i = 0; i < 16; i += 1) {
      const rad = i % 2 === 0 ? r : r * 0.415;
      const a = (Math.PI / 8) * i - Math.PI / 8;
      pts.push(`${(Math.cos(a) * rad).toFixed(2)},${(Math.sin(a) * rad).toFixed(2)}`);
    }
    return pts.join(' ');
  };

  let tiles = '';
  for (let row = 0; row * step < size + step; row += 1) {
    for (let col = 0; col * step < size + step; col += 1) {
      const cx = col * step + (row % 2 ? step / 2 : 0);
      const cy = row * step;
      const alt = (row + col) % 2 === 0;
      tiles += `
    <g transform="translate(${cx} ${cy})">
      <polygon points="${star(52)}" fill="${alt ? C.brass : C.verdigris}" fill-opacity="${alt ? 0.55 : 0.40}"
               stroke="${C.brassHi}" stroke-opacity="0.35" stroke-width="1.2"/>
      <polygon points="${star(23)}" fill="${C.noir}" fill-opacity="0.55"/>
      <circle r="6" fill="${C.brassHi}" fill-opacity="0.65"/>
    </g>`;
    }
  }

  return svg(
    size,
    size,
    `
  <defs>
    <linearGradient id="tileBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.jade}"/>
      <stop offset="100%" stop-color="${C.noir}"/>
    </linearGradient>
    <radialGradient id="tileLight" cx="30%" cy="24%" r="82%">
      <stop offset="0%" stop-color="${C.brassHi}" stop-opacity="0.26"/>
      <stop offset="100%" stop-color="${C.noir}" stop-opacity="0"/>
    </radialGradient>
    ${grainFilter('tileGrain', 0.3)}
  </defs>
  <rect width="${size}" height="${size}" fill="url(#tileBg)"/>
  ${tiles}
  <rect width="${size}" height="${size}" fill="url(#tileLight)"/>
  <rect width="${size}" height="${size}" filter="url(#tileGrain)" opacity="0.26"/>
`,
    'aria-label="Geometric zellige tilework"'
  );
}

/* ---------------------------------------------------------------------------
 * interior — a colonnade of arches receding into low light
 * ------------------------------------------------------------------------ */
function interior() {
  const w = 1600;
  const h = 900;
  let arches = '';
  const layers = 6;

  for (let i = layers; i >= 1; i -= 1) {
    const t = i / layers;
    const aw = 300 * t + 260;
    const ah = 640 * t + 120;
    const ax = (w - aw) / 2;
    const ay = h - ah;
    const shade = 0.14 + (1 - t) * 0.30;
    arches += `
    <path d="${archPath(aw, ah)}" transform="translate(${ax} ${ay})"
          fill="${C.noir}" fill-opacity="${shade.toFixed(3)}"
          stroke="${C.brassHi}" stroke-opacity="${(0.34 + (1 - t) * 0.60).toFixed(3)}"
          stroke-width="${(2 + (1 - t) * 2).toFixed(2)}"/>`;
  }

  return svg(
    w,
    h,
    `
  <defs>
    <linearGradient id="hall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.stone}"/>
      <stop offset="100%" stop-color="${C.noir}"/>
    </linearGradient>
    <radialGradient id="far" cx="50%" cy="62%" r="38%">
      <stop offset="0%" stop-color="#FFF6E2" stop-opacity="0.92"/>
      <stop offset="34%" stop-color="${C.brassHi}" stop-opacity="0.46"/>
      <stop offset="70%" stop-color="${C.brass}" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="${C.noir}" stop-opacity="0"/>
    </radialGradient>
    ${steamFilter('hallSteam', '0.012 0.030', 3)}
    ${grainFilter('hallGrain', 0.32)}
  </defs>
  <rect width="${w}" height="${h}" fill="url(#hall)"/>
  <rect width="${w}" height="${h}" fill="url(#far)"/>
  ${arches}
  <rect width="${w}" height="${h}" filter="url(#hallSteam)" opacity="0.24"/>
  <rect width="${w}" height="${h}" filter="url(#hallGrain)" opacity="0.28"/>
`,
    'aria-label="A colonnade of arches receding into low light"'
  );
}

/* ---------------------------------------------------------------------------
 * Three category tiles, one per service group
 * ------------------------------------------------------------------------ */

/** massage — warm oil pooling in concentric rings */
function massage() {
  const w = 900;
  const h = 1200;
  let rings = '';
  for (let i = 12; i >= 1; i -= 1) {
    const t = i / 12;
    rings += `<ellipse cx="${w / 2}" cy="${h * 0.56}" rx="${370 * t}" ry="${310 * t}"
      fill="none" stroke="${C.brassHi}" stroke-opacity="${(0.16 + (1 - t) * 0.55).toFixed(3)}"
      stroke-width="${(1.4 + (1 - t) * 3.2).toFixed(2)}"/>`;
  }
  return svg(
    w,
    h,
    `
  <defs>
    <linearGradient id="oilBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.jade}"/>
      <stop offset="100%" stop-color="${C.noir}"/>
    </linearGradient>
    <radialGradient id="oilPool" cx="50%" cy="56%" r="56%">
      <stop offset="0%" stop-color="#FFF1D8" stop-opacity="0.80"/>
      <stop offset="26%" stop-color="${C.brassHi}" stop-opacity="0.52"/>
      <stop offset="62%" stop-color="${C.brass}" stop-opacity="0.24"/>
      <stop offset="100%" stop-color="${C.noir}" stop-opacity="0"/>
    </radialGradient>
    ${grainFilter('oilGrain', 0.3)}
  </defs>
  <rect width="${w}" height="${h}" fill="url(#oilBg)"/>
  <rect width="${w}" height="${h}" fill="url(#oilPool)"/>
  ${rings}
  <rect width="${w}" height="${h}" filter="url(#oilGrain)" opacity="0.22"/>
`,
    'aria-label="Warm oil pooling in concentric rings"'
  );
}

/** body — steam rising in layered bands */
function body() {
  const w = 900;
  const h = 1200;
  let bands = '';
  for (let i = 0; i < 9; i += 1) {
    const y = h * 0.14 + i * (h * 0.085);
    const amp = 26 + i * 5;
    bands += `<path d="M -40 ${y} C ${w * 0.28} ${y - amp}, ${w * 0.62} ${y + amp}, ${w + 40} ${y}"
      fill="none" stroke="#FFFBF2" stroke-opacity="${(0.62 - i * 0.055).toFixed(3)}"
      stroke-width="${(3.4 - i * 0.2).toFixed(2)}"/>`;
  }
  return svg(
    w,
    h,
    `
  <defs>
    <linearGradient id="steamBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.verdigris}"/>
      <stop offset="46%" stop-color="${C.jade}"/>
      <stop offset="100%" stop-color="${C.noir}"/>
    </linearGradient>
    <radialGradient id="steamLight" cx="50%" cy="16%" r="70%">
      <stop offset="0%" stop-color="#FFFBF2" stop-opacity="0.62"/>
      <stop offset="52%" stop-color="${C.steam}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="${C.noir}" stop-opacity="0"/>
    </radialGradient>
    ${steamFilter('bodySteam', '0.014 0.032', 4)}
    ${grainFilter('bodyGrain', 0.3)}
  </defs>
  <rect width="${w}" height="${h}" fill="url(#steamBg)"/>
  <rect width="${w}" height="${h}" fill="url(#steamLight)"/>
  ${bands}
  <rect width="${w}" height="${h}" filter="url(#bodySteam)" opacity="0.42"/>
  <rect width="${w}" height="${h}" filter="url(#bodyGrain)" opacity="0.20"/>
`,
    'aria-label="Steam rising in layered bands of light"'
  );
}

/** beauty — a polished brass bowl catching the light */
function beauty() {
  const w = 900;
  const h = 1200;
  const cx = w / 2;
  const cy = h * 0.54;
  return svg(
    w,
    h,
    `
  <defs>
    <linearGradient id="bowlBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.noir}"/>
      <stop offset="100%" stop-color="${C.stone}"/>
    </linearGradient>
    <linearGradient id="bowlMetal" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0%" stop-color="${C.brassHi}"/>
      <stop offset="42%" stop-color="${C.brass}"/>
      <stop offset="70%" stop-color="${C.brassDeep}"/>
      <stop offset="100%" stop-color="${C.brassHi}" stop-opacity="0.8"/>
    </linearGradient>
    <radialGradient id="bowlGlow" cx="50%" cy="50%" r="56%">
      <stop offset="0%" stop-color="${C.brass}" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="${C.noir}" stop-opacity="0"/>
    </radialGradient>
    ${grainFilter('bowlGrain', 0.3)}
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bowlBg)"/>
  <rect width="${w}" height="${h}" fill="url(#bowlGlow)"/>

  <!-- shadow on the surface it stands on -->
  <ellipse cx="${cx}" cy="${cy + 232}" rx="290" ry="40" fill="${C.noir}" fill-opacity="0.6"/>

  <!-- bowl body: a hemisphere sitting under its rim -->
  <path d="M ${cx - 250} ${cy - 60} A 250 250 0 0 0 ${cx + 250} ${cy - 60} Z"
        fill="url(#bowlMetal)"/>
  <!-- inner shadow, so it reads as hollow rather than solid -->
  <ellipse cx="${cx}" cy="${cy - 60}" rx="250" ry="76" fill="${C.noir}" fill-opacity="0.62"/>
  <ellipse cx="${cx}" cy="${cy - 54}" rx="214" ry="60" fill="${C.brassDeep}" fill-opacity="0.55"/>
  <!-- rim -->
  <ellipse cx="${cx}" cy="${cy - 60}" rx="250" ry="76" fill="none"
           stroke="${C.brassHi}" stroke-opacity="0.95" stroke-width="6"/>
  <!-- specular highlight down the belly -->
  <path d="M ${cx - 158} ${cy + 24} A 232 232 0 0 0 ${cx - 52} ${cy + 168}"
        fill="none" stroke="#FFF6E2" stroke-opacity="0.6" stroke-width="14" stroke-linecap="round"/>
  <path d="M ${cx + 120} ${cy + 52} A 232 232 0 0 1 ${cx + 40} ${cy + 172}"
        fill="none" stroke="#FFF6E2" stroke-opacity="0.28" stroke-width="8" stroke-linecap="round"/>

  <rect width="${w}" height="${h}" filter="url(#bowlGrain)" opacity="0.2"/>
`,
    'aria-label="A polished brass bowl catching the light"'
  );
}

/* ---------------------------------------------------------------------------
 * favicon — the arch mark on its own
 * ------------------------------------------------------------------------ */
function favicon() {
  const s = 64;
  const aw = 34;
  const ah = 42;
  return svg(
    s,
    s,
    `
  <rect width="${s}" height="${s}" rx="12" fill="${C.noir}"/>
  <path d="${archPath(aw, ah)}" transform="translate(${(s - aw) / 2} ${(s - ah) / 2 + 3})"
        fill="none" stroke="${C.brass}" stroke-width="3"/>
  <circle cx="${s / 2}" cy="${s / 2 + 6}" r="3.4" fill="${C.brassHi}"/>
`
  );
}

/* ---------------------------------------------------------------------------
 * share — the link-preview card (1200x630), rasterised to PNG separately
 * ------------------------------------------------------------------------ */
function share() {
  const w = 1200;
  const h = 630;
  const aw = 250;
  const ah = 330;
  const ax = w - aw - 110;
  const ay = (h - ah) / 2;

  return svg(
    w,
    h,
    `
  <defs>
    <linearGradient id="shareBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.noir}"/>
      <stop offset="60%" stop-color="${C.stone}"/>
      <stop offset="100%" stop-color="${C.jade}"/>
    </linearGradient>
    <linearGradient id="shareArch" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.brassHi}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${C.clay}" stop-opacity="0.45"/>
    </linearGradient>
    <radialGradient id="shareGlow" cx="76%" cy="50%" r="52%">
      <stop offset="0%" stop-color="${C.brass}" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="${C.noir}" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="shareClip">
      <path d="${archPath(aw, ah)}" transform="translate(${ax} ${ay})"/>
    </clipPath>
    ${steamFilter('shareSteam', '0.012 0.028', 3)}
  </defs>

  <rect width="${w}" height="${h}" fill="url(#shareBg)"/>
  <rect width="${w}" height="${h}" fill="url(#shareGlow)"/>

  <g clip-path="url(#shareClip)">
    <rect x="${ax}" y="${ay}" width="${aw}" height="${ah}" fill="url(#shareArch)"/>
    <rect x="${ax}" y="${ay}" width="${aw}" height="${ah}" filter="url(#shareSteam)" opacity="0.45"/>
  </g>
  <path d="${archPath(aw, ah)}" transform="translate(${ax} ${ay})"
        fill="none" stroke="${C.brassHi}" stroke-opacity="0.6" stroke-width="2.5"/>

  <text x="110" y="268" font-family="Georgia, 'Times New Roman', serif" font-size="76"
        fill="${C.steam}">${escapeXml(site.business.name)}</text>
  <text x="110" y="330" font-family="Helvetica, Arial, sans-serif" font-size="27"
        letter-spacing="3" fill="${C.brass}">${escapeXml(
          site.business.tagline.toUpperCase()
        )}</text>
  <line x1="110" y1="372" x2="330" y2="372" stroke="${C.brass}" stroke-opacity="0.6" stroke-width="2"/>
  <text x="110" y="424" font-family="Helvetica, Arial, sans-serif" font-size="25"
        fill="${C.steamSoft}">${escapeXml(site.contact.address.lines.join(' · '))}</text>
  <text x="110" y="464" font-family="Helvetica, Arial, sans-serif" font-size="25"
        fill="${C.steamSoft}">Open until 11 PM, seven days a week</text>
`
  );
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/* ------------------------------------------------------------------------ */

const files = {
  'hero.svg': hero(),
  'hammam.svg': hammam(),
  'interior.svg': interior(),
  'massage.svg': massage(),
  'body.svg': body(),
  'beauty.svg': beauty(),
  'favicon.svg': favicon(),
  'share.svg': share(),
};

await mkdir(OUT, { recursive: true });
for (const [name, contents] of Object.entries(files)) {
  await writeFile(join(OUT, name), contents);
}
console.log(`Generated ${Object.keys(files).length} artwork files -> src/assets/img/`);
