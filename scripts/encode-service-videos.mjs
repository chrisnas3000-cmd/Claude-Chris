/**
 * Encodes the three service-card clips for the web.
 *
 *   node scripts/encode-service-videos.mjs <massage> <body> <beauty>
 *
 * Each argument is a path to a source video. Produces, per category, an MP4
 * and a WebM plus a poster frame, written straight into src/assets/.
 *
 * Two things it does that matter:
 *
 *  - **Crossfade loop.** The tail is dissolved back over the head, so the clip
 *    loops without the jump cut a plain loop leaves at the seam. The hero uses
 *    a boomerang instead, but that is wrong here: these shots contain hands
 *    moving in one direction, and playing a massage stroke backwards reads as
 *    obviously fake. A dissolve keeps every frame moving forwards.
 *
 *  - **Silence.** `-an` guarantees no audio track ships, whatever the source
 *    contained.
 *
 * Output matches the card frame's 4:3 ratio, so a 4:3 source is preserved
 * intact and any other ratio is centre-cropped to fit. Keep the subject
 * centred either way.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const run = promisify(execFile);
const FFMPEG = resolve('node_modules/ffmpeg-static/ffmpeg');
const VIDEO_DIR = resolve('src/assets/video');
const IMG_DIR = resolve('src/assets/img');

/*
  The card frame is 4:3 and never renders above 366 x 275 CSS px, so 1000 x 750
  covers 2x with headroom and keeps each file small. Encoding at the frame's
  own ratio means a 4:3 source loses nothing; anything else is centre-cropped
  to fit, which is what the card would do at display time anyway.
*/
const WIDTH = 1000;
const HEIGHT = 750;
/** Seconds of dissolve between the tail and the head. */
const FADE = 1.0;

const CATEGORIES = ['massage', 'body', 'beauty'];
const sources = process.argv.slice(2);

if (sources.length !== 3) {
  console.error('Usage: node scripts/encode-service-videos.mjs <massage> <body> <beauty>');
  console.error('Three source files are required, in that order.');
  process.exit(1);
}
if (!existsSync(FFMPEG)) {
  console.error('ffmpeg not found. Run: npm install');
  process.exit(1);
}

async function duration(file) {
  // ffmpeg reports duration on stderr; no ffprobe in this dependency.
  const { stderr } = await run(FFMPEG, ['-hide_banner', '-i', file], { encoding: 'utf8' })
    .catch((error) => ({ stderr: error.stderr ?? '' }));
  const match = stderr.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  if (!match) throw new Error(`could not read duration of ${file}`);
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

await mkdir(VIDEO_DIR, { recursive: true });
await mkdir(IMG_DIR, { recursive: true });

for (const [i, category] of CATEGORIES.entries()) {
  const source = resolve(sources[i]);
  if (!existsSync(source)) {
    console.error(`missing source for ${category}: ${source}`);
    process.exit(1);
  }

  const total = await duration(source);
  const fade = Math.min(FADE, total / 4);
  const kept = (total - fade).toFixed(3);

  // Dissolve the tail back over the head: the clip ends where it began.
  const filter =
    `[0:v]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,` +
    `crop=${WIDTH}:${HEIGHT},setsar=1,split[a][b];` +
    `[a]trim=0:${kept},setpts=PTS-STARTPTS[main];` +
    `[b]trim=${kept}:${total.toFixed(3)},setpts=PTS-STARTPTS,format=yuva420p,` +
    `fade=t=out:st=0:d=${fade}:alpha=1[tail];` +
    `[main][tail]overlay=eof_action=pass,format=yuv420p[v]`;

  const mp4 = join(VIDEO_DIR, `service-${category}.mp4`);
  const webm = join(VIDEO_DIR, `service-${category}.webm`);
  const poster = join(IMG_DIR, `service-${category}-poster.jpg`);

  await run(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-i', source,
    '-filter_complex', filter, '-map', '[v]', '-an',
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-crf', '28', '-preset', 'slow', '-movflags', '+faststart', mp4, '-y']);

  await run(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-i', source,
    '-filter_complex', filter, '-map', '[v]', '-an',
    '-c:v', 'libvpx-vp9', '-crf', '38', '-b:v', '0', '-row-mt', '1',
    '-deadline', 'good', '-cpu-used', '3', webm, '-y']);

  await run(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-ss', '0.3', '-i', source,
    '-frames:v', '1',
    '-vf', `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT}`,
    '-q:v', '5', poster, '-y']);

  const sizes = await Promise.all([mp4, webm, poster].map(async (f) => (await stat(f)).size));
  console.log(
    `${category.padEnd(8)} ${(total).toFixed(1)}s → ${kept}s loop  ` +
    `mp4 ${(sizes[0] / 1024).toFixed(0)}KB · webm ${(sizes[1] / 1024).toFixed(0)}KB · ` +
    `poster ${(sizes[2] / 1024).toFixed(0)}KB`
  );
}

console.log('\nDone. Set `video: true` on each category in src/_data/site.js to switch them on.');
