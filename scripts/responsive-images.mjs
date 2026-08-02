/**
 * Derives phone-sized copies of every photograph the site displays.
 *
 *   node scripts/responsive-images.mjs        (wired into `npm run build`)
 *
 * The artwork ships at desktop resolution — up to 1600px wide — while most
 * visitors view it in a box a few hundred CSS pixels across. This writes a
 * half-width copy of each one next to the original, named `<name>-<width>w.jpg`,
 * and the media macro offers both through `srcset` so the browser takes the
 * one it can actually use.
 *
 * Nothing here decides which image goes where; it simply follows whatever
 * src/_data/site.js references, so replacing a photograph needs no edit.
 *
 * Note for anyone adding files by hand: `npm run art` sweeps src/assets/img of
 * anything unreferenced, and it recognises this `-<width>w` suffix. A variant
 * named any other way will be deleted on the next build.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join, extname, basename } from 'node:path';
import site from '../src/_data/site.js';

const run = promisify(execFile);
const FFMPEG = resolve('node_modules/ffmpeg-static/ffmpeg');
const IMG_DIR = resolve('src/assets/img');
/*
  Written into _data so the templates can read it as `imageVariants`. It holds
  the real measured widths, which srcset needs to be truthful about — guessing
  them from the filename would put the browser's selection on a false footing.
*/
const MANIFEST = resolve('src/_data/imageVariants.json');

/** Every photograph the templates can render, however site.js refers to it. */
const sources = [
  ...Object.values(site.images).map((image) => image.src),
  site.heroVideo?.poster,
  ...Object.entries(site.images)
    .filter(([, image]) => image.video)
    .map(([key]) => `/assets/img/service-${key}-poster.jpg`),
]
  .filter((path) => path && /\.jpe?g$/i.test(path))
  .map((path) => path.split('/').pop())
  .filter((name, i, all) => all.indexOf(name) === i);

if (!existsSync(FFMPEG)) {
  console.error('ffmpeg not found. Run: npm install');
  process.exit(1);
}

async function widthOf(file) {
  const { stderr } = await run(FFMPEG, ['-hide_banner', '-i', file], { encoding: 'utf8' })
    .catch((error) => ({ stderr: error.stderr ?? '' }));
  const match = stderr.match(/,\s*(\d+)x(\d+)[\s,[]/);
  if (!match) throw new Error(`could not read dimensions of ${file}`);
  return Number(match[1]);
}

let saved = 0;
const made = [];
const manifest = {};

for (const name of sources) {
  const source = join(IMG_DIR, name);
  if (!existsSync(source)) continue;

  const full = await widthOf(source);
  // Half width lands every one of these between 500 and 800px — enough for a
  // phone at 2x, and past the point where another step down would show.
  const width = 2 * Math.round(full / 4);
  const variantName = `${basename(name, extname(name))}-${width}w${extname(name)}`;
  const variant = join(IMG_DIR, variantName);

  await run(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-i', source,
    '-vf', `scale=${width}:-2:flags=lanczos`, '-q:v', '6', variant, '-y']);

  const [big, small] = await Promise.all([source, variant].map(async (f) => (await stat(f)).size));
  saved += big - small;
  made.push(`${name}  ${full}px ${(big / 1024).toFixed(0)}KB -> ${width}px ${(small / 1024).toFixed(0)}KB`);

  manifest[`/assets/img/${name}`] = {
    full,
    small: width,
    smallSrc: `/assets/img/${variantName}`,
  };
}

await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

made.forEach((line) => console.log(line));
console.log(
  `\n${made.length} variant(s) -> src/assets/img/  ` +
  `(${(saved / 1024).toFixed(0)} KB lighter if a phone loads every one).`
);
