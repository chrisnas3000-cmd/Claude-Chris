/**
 * Turns the generated SVG artwork into the PNG files that some platforms
 * insist on: the social link-preview card and the iOS home-screen icon.
 *
 * WhatsApp in particular will not render an SVG link preview, and that is the
 * main channel this site pushes people towards — so share.png matters.
 *
 * Run with `npm run raster` (build does it automatically).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const IMG = join(process.cwd(), 'src', 'assets', 'img');

/**
 * Use a Chromium that is already on the machine when Playwright's own
 * download is missing or is a different build. Falls back to Playwright's
 * bundled browser when none of these paths exist.
 */
function findChromium() {
  const candidates = [
    process.env.CHROMIUM_PATH,
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
  ].filter(Boolean);
  return candidates.find((path) => existsSync(path));
}

const jobs = [
  { from: 'share.svg', to: 'share.png', width: 1200, height: 630 },
  { from: 'favicon.svg', to: 'apple-touch-icon.png', width: 180, height: 180 },
];

const executablePath = findChromium();
const browser = await chromium.launch(executablePath ? { executablePath } : {});

for (const job of jobs) {
  const svg = await readFile(join(IMG, job.from), 'utf8');
  const page = await browser.newPage({
    viewport: { width: job.width, height: job.height },
    deviceScaleFactor: 1,
  });

  await page.setContent(
    `<!doctype html><meta charset="utf-8">
     <style>
       html,body{margin:0;padding:0;background:transparent}
       svg{display:block;width:${job.width}px;height:${job.height}px}
     </style>
     ${svg}`,
    { waitUntil: 'load' }
  );

  // SVG filters (the steam and grain) need a frame to finish compositing.
  await page.waitForTimeout(250);

  const buffer = await page.screenshot({ type: 'png', omitBackground: false });
  await writeFile(join(IMG, job.to), buffer);
  await page.close();
  console.log(`${job.from} -> ${job.to} (${job.width}x${job.height})`);
}

await browser.close();
