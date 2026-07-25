/**
 * Serves the built site and captures screenshots at phone, tablet and desktop
 * widths, then reports any console errors or failed requests it saw.
 *
 * Run with `npm run shots` after a build. Images land in .screenshots/.
 */
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { chromium } from 'playwright';

const OUT = resolve(process.cwd(), '_site');
const SHOTS = resolve(process.cwd(), '.screenshots');
const PORT = 8099;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer(async (req, res) => {
  let path = decodeURIComponent(req.url.split('?')[0]);
  let file = join(OUT, path);
  if (path.endsWith('/')) file = join(file, 'index.html');
  else if (!extname(file)) file = join(file, 'index.html');

  if (!existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
    return;
  }
  const body = await readFile(file);
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(body);
});

await new Promise((done) => server.listen(PORT, done));

const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844, mobile: true },
  { name: 'tablet', width: 834, height: 1112, mobile: false },
  { name: 'desktop', width: 1440, height: 900, mobile: false },
];

const PAGES = [
  { name: 'home', url: '/' },
  { name: 'treatments', url: '/treatments/' },
  { name: 'about', url: '/about/' },
  { name: 'visit', url: '/visit/' },
  { name: '404', url: '/404.html' },
];

function findChromium() {
  const candidates = [
    process.env.CHROMIUM_PATH,
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    '/usr/bin/chromium',
  ].filter(Boolean);
  return candidates.find((p) => existsSync(p));
}

await mkdir(SHOTS, { recursive: true });
const executablePath = findChromium();
const browser = await chromium.launch(executablePath ? { executablePath } : {});

const problems = [];

for (const viewport of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.mobile,
    hasTouch: viewport.mobile,
    deviceScaleFactor: 1,
  });

  for (const target of PAGES) {
    const page = await context.newPage();

    page.on('console', (msg) => {
      if (msg.type() === 'error') problems.push(`[${viewport.name} ${target.name}] console: ${msg.text()}`);
    });
    page.on('pageerror', (err) => {
      problems.push(`[${viewport.name} ${target.name}] pageerror: ${err.message}`);
    });
    page.on('requestfailed', (req) => {
      problems.push(`[${viewport.name} ${target.name}] failed request: ${req.url()}`);
    });

    await page.goto(`http://127.0.0.1:${PORT}${target.url}`, { waitUntil: 'networkidle' });

    // The site scrolls smoothly, which means a scripted scrollTo animates and
    // the capture can land mid-flight — putting the fixed header somewhere it
    // never actually appears. Turn it off for the duration of the shot.
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });

    // Step down the page a screen at a time so every reveal fires. Jumping
    // straight to the bottom skips the middle entirely — those elements never
    // intersect the viewport, so they stay hidden and vanish from the capture.
    const screens = await page.evaluate(
      () => Math.ceil(document.body.scrollHeight / window.innerHeight)
    );
    for (let i = 1; i <= screens; i += 1) {
      await page.evaluate((n) => window.scrollTo(0, window.innerHeight * n), i);
      await page.waitForTimeout(300);
    }
    // Long enough for the last stagger to finish, or the final items in a list
    // are still mid-fade when the shutter goes.
    await page.waitForTimeout(1200);

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForFunction(() => window.scrollY === 0, null, { timeout: 3000 });
    await page.waitForTimeout(400);

    // Horizontal overflow is the classic responsive bug — catch it here.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    if (overflow > 1) {
      problems.push(`[${viewport.name} ${target.name}] horizontal overflow of ${overflow}px`);
    }

    await page.screenshot({
      path: join(SHOTS, `${target.name}-${viewport.name}.png`),
      fullPage: true,
    });
    await page.close();
  }
  await context.close();
}

await browser.close();
server.close();

await writeFile(
  join(SHOTS, 'report.txt'),
  problems.length ? problems.join('\n') : 'No console errors, failed requests or overflow detected.'
);

console.log(`Captured ${VIEWPORTS.length * PAGES.length} screenshots -> .screenshots/`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  problems.forEach((p) => console.error(`  x ${p}`));
  process.exit(1);
}
console.log('No console errors, failed requests or horizontal overflow.');
