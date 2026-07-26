/**
 * Measures real contrast of the hero type against the video behind it.
 *
 * Text over film cannot be checked with a static audit: the background moves,
 * so a frame that passes now may not in three seconds. This samples the actual
 * composited pixels behind each text region across the whole loop, and reports
 * the worst frame rather than an average.
 */
import { createServer } from 'node:http';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { chromium } from 'playwright';

const run = promisify(execFile);
const FFMPEG = resolve('node_modules/ffmpeg-static/ffmpeg');
const OUT = resolve('_site');
const TMP = '/tmp/claude-0/-home-user-Claude-Chris/32e0fec5-46f3-53f1-a9f7-b61f97b80356/scratchpad';
const TYPES = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml',
  '.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.mp4':'video/mp4','.webm':'video/webm' };

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  let f = join(OUT, p);
  if (p.endsWith('/')) f = join(f, 'index.html'); else if (!extname(f)) f = join(f, 'index.html');
  if (!existsSync(f)) { res.writeHead(404); res.end('nf'); return; }
  const b = await readFile(f);
  res.writeHead(200, { 'Content-Type': TYPES[extname(f)] ?? 'application/octet-stream',
    'Content-Length': b.length, 'Accept-Ranges': 'bytes' });
  res.end(b);
});
await new Promise((d) => server.listen(8086, d));

const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (l1, l2) => { const [h, l] = l1 > l2 ? [l1, l2] : [l2, l1]; return (h + 0.05) / (l + 0.05); };
const IVORY = lum(247, 242, 234);
const SAND = lum(221, 208, 190);

/** Brightest pixel and mean in a PNG region — the brightest is what fails. */
async function analyse(pngPath) {
  const raw = `${pngPath}.raw`;
  await run(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-i', pngPath,
    '-f', 'rawvideo', '-pix_fmt', 'rgb24', raw, '-y']);
  const buf = await readFile(raw);
  const all = [];
  for (let i = 0; i < buf.length; i += 3) all.push(lum(buf[i], buf[i + 1], buf[i + 2]));
  all.sort((a, b) => a - b);
  await unlink(raw);
  return {
    maxL: all[all.length - 1],
    // A lone specular highlight — a candle flame behind one glyph — should not
    // condemn a whole headline, but the bright tail of the region should still
    // be legible. The 95th percentile is the number to design against.
    p95: all[Math.floor(all.length * 0.95)],
    meanL: all.reduce((a, b) => a + b, 0) / all.length,
  };
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

for (const vp of [{ n: 'desktop', w: 1440, h: 900 }, { n: 'phone', w: 390, h: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: vp.w < 500 });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8086/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => {
    const v = document.querySelector('[data-hero-video]');
    return v && v.readyState >= 3;
  }, null, { timeout: 20000 });

  const targets = [
    { name: 'headline', sel: '.hero__title' },
    { name: 'lead', sel: '.hero__lead' },
    { name: 'eyebrow', sel: '.eyebrow--on-film' },
    { name: 'nav', sel: '.header .nav__list' },
    { name: 'logo', sel: '.header .logo' },
  ];

  // Hide the type so the screenshot captures only what sits behind it.
  await page.addStyleTag({ content: `
    .hero__title, .hero__lead, .eyebrow--on-film, .header .nav__list,
    .header .logo, .hero__actions { visibility: hidden !important; }
    .hero__video { transition: none !important; }` });

  const duration = await page.evaluate(() => document.querySelector('[data-hero-video]').duration);
  const worst = {};

  for (const t of [0.2, 2, 4, 6, 8, 10, 12, 14, 16, 18, Math.max(0, duration - 0.3)]) {
    await page.evaluate((time) => {
      const v = document.querySelector('[data-hero-video]');
      v.pause(); v.currentTime = time;
    }, t);
    await page.waitForFunction(() => document.querySelector('[data-hero-video]').seeking === false,
      null, { timeout: 8000 });
    await page.waitForTimeout(180);

    for (const target of targets) {
      // Measure where the glyphs actually are, not the block that contains
      // them. A full-width <p> whose text sits in the left quarter would
      // otherwise be judged against bright pixels nowhere near a letter.
      const box = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const range = document.createRange();
        range.selectNodeContents(el);
        const rects = Array.from(range.getClientRects()).filter((r) => r.width > 1 && r.height > 1);
        if (!rects.length) {
          const b = el.getBoundingClientRect();
          return { x: b.x, y: b.y, width: b.width, height: b.height };
        }
        const x = Math.min(...rects.map((r) => r.left));
        const y = Math.min(...rects.map((r) => r.top));
        const right = Math.max(...rects.map((r) => r.right));
        const bottom = Math.max(...rects.map((r) => r.bottom));
        return { x, y, width: right - x, height: bottom - y };
      }, target.sel);
      if (!box || box.width < 2 || box.height < 2) continue;
      const clip = {
        x: Math.max(0, Math.floor(box.x)), y: Math.max(0, Math.floor(box.y)),
        width: Math.min(Math.ceil(box.width), vp.w - Math.floor(box.x)),
        height: Math.min(Math.ceil(box.height), vp.h - Math.floor(box.y)),
      };
      if (clip.width < 2 || clip.height < 2) continue;
      const shot = join(TMP, `cv-${vp.n}-${target.name}.png`);
      await page.screenshot({ path: shot, clip });
      const { maxL, p95 } = await analyse(shot);
      const fg = target.name === 'eyebrow' ? SAND : IVORY;
      const r = ratio(fg, p95);
      const rMax = ratio(fg, maxL);
      if (!worst[target.name] || r < worst[target.name].r) {
        worst[target.name] = { r, rMax, t };
      }
      await unlink(shot);
    }
  }

  console.log(`\n${vp.n}`);
  for (const [name, v] of Object.entries(worst)) {
    const pass = v.r >= 4.5 ? 'AA' : v.r >= 3 ? 'AA-large only' : 'FAIL';
    console.log(`  ${name.padEnd(9)} p95 ${v.r.toFixed(2)}:1  (max ${v.rMax.toFixed(2)}:1)  at ${v.t}s  ${pass}`);
  }
  await ctx.close();
}

await browser.close();
server.close();
