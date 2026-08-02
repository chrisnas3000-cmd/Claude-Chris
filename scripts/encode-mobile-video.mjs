/**
 * Builds phone-sized copies of every video the site ships.
 *
 *   node scripts/encode-mobile-video.mjs
 *
 * Most visitors arrive on a phone, where the desktop hero is roughly four
 * times the pixels the screen can show. This derives a small variant of each
 * clip and writes it alongside the original as `<name>-sm.mp4` / `.webm`.
 * `main.js` picks the small pair below the 48rem breakpoint.
 *
 * It re-encodes the *published* files rather than the original footage, which
 * matters: the loop treatment is already baked into them — a boomerang for the
 * hero, a crossfade for the service cards — so the small copies loop exactly
 * as the full-size ones do, and the sources are not needed to rebuild them.
 * Generational loss at these bitrates is not visible on a phone.
 *
 * Re-run this after re-encoding any source video, or the small copy will still
 * show the old footage. `npm run check:video-sizes` fails if one is stale.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const run = promisify(execFile);
const FFMPEG = resolve('node_modules/ffmpeg-static/ffmpeg');
const VIDEO_DIR = resolve('src/assets/video');

/*
  Widths are chosen against the CSS box, not the device:

  - The hero is full-bleed, so its box is the viewport. 854 covers a 430px
    phone at 2x. It is soft, moving footage behind a scrim — the last thing
    on the page that needs pixel density.
  - A service card never exceeds 366 CSS px wide, and on a phone sits around
    342. 640 covers that comfortably at 2x.
*/
const TARGETS = [
  { name: 'hero', width: 854 },
  { name: 'service-massage', width: 640 },
  { name: 'service-body', width: 640 },
  { name: 'service-beauty', width: 640 },
];

if (!existsSync(FFMPEG)) {
  console.error('ffmpeg not found. Run: npm install');
  process.exit(1);
}

/** Height that preserves the source ratio, rounded to an even number. */
async function heightFor(file, width) {
  const { stderr } = await run(FFMPEG, ['-hide_banner', '-i', file], { encoding: 'utf8' })
    .catch((error) => ({ stderr: error.stderr ?? '' }));
  const match = stderr.match(/,\s*(\d+)x(\d+)[\s,[]/);
  if (!match) throw new Error(`could not read dimensions of ${file}`);
  const [, w, h] = match.map(Number);
  return { height: 2 * Math.round((width * h) / w / 2), source: `${w}x${h}` };
}

let saved = 0;
let before = 0;

for (const target of TARGETS) {
  const mp4 = join(VIDEO_DIR, `${target.name}.mp4`);
  const webm = join(VIDEO_DIR, `${target.name}.webm`);
  if (!existsSync(mp4)) {
    console.error(`missing ${mp4} — nothing to derive from`);
    process.exit(1);
  }

  const { height, source } = await heightFor(mp4, target.width);
  const scale = `scale=${target.width}:${height}:flags=lanczos`;
  const smallMp4 = join(VIDEO_DIR, `${target.name}-sm.mp4`);
  const smallWebm = join(VIDEO_DIR, `${target.name}-sm.webm`);

  // -an again, belt and braces: a silent source cannot gain audio, but these
  // files are the ones that autoplay, and a muted attribute is not a promise.
  await run(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-i', mp4,
    '-vf', scale, '-an',
    '-c:v', 'libx264', '-profile:v', 'main', '-pix_fmt', 'yuv420p',
    '-crf', '30', '-preset', 'slow', '-movflags', '+faststart', smallMp4, '-y']);

  await run(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-i', existsSync(webm) ? webm : mp4,
    '-vf', scale, '-an',
    '-c:v', 'libvpx-vp9', '-crf', '40', '-b:v', '0', '-row-mt', '1',
    '-deadline', 'good', '-cpu-used', '3', smallWebm, '-y']);

  const [bigMp4, bigWebm, smMp4, smWebm] = await Promise.all(
    [mp4, existsSync(webm) ? webm : mp4, smallMp4, smallWebm].map(async (f) => (await stat(f)).size)
  );

  before += bigMp4;
  saved += bigMp4 - smMp4;

  const pct = (a, b) => `${Math.round((1 - b / a) * 100)}% smaller`;
  console.log(
    `${target.name.padEnd(16)} ${source} -> ${target.width}x${height}\n` +
    `${''.padEnd(16)} mp4  ${(bigMp4 / 1024).toFixed(0)}KB -> ${(smMp4 / 1024).toFixed(0)}KB  (${pct(bigMp4, smMp4)})\n` +
    `${''.padEnd(16)} webm ${(bigWebm / 1024).toFixed(0)}KB -> ${(smWebm / 1024).toFixed(0)}KB  (${pct(bigWebm, smWebm)})`
  );
}

console.log(
  `\nPhones now fetch ${(saved / 1024 / 1024).toFixed(2)} MB less of MP4 ` +
  `across all four clips (was ${(before / 1024 / 1024).toFixed(2)} MB).`
);
