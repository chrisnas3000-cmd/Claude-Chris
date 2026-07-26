/**
 * Functional tests for the interactive parts of the site.
 * Run with `npm run e2e` after a build.
 *
 * Covers the things a visitor actually does: open the menu on a phone,
 * navigate, jump to a treatment category, and reach the booking bar.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { chromium } from 'playwright';

const OUT = resolve(process.cwd(), '_site');
const PORT = 8095;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

const server = createServer(async (req, res) => {
  let path = decodeURIComponent(req.url.split('?')[0]);
  let file = join(OUT, path);
  if (path.endsWith('/')) file = join(file, 'index.html');
  else if (!extname(file)) file = join(file, 'index.html');
  if (!existsSync(file)) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(await readFile(file));
});
await new Promise((done) => server.listen(PORT, done));

function findChromium() {
  return [
    process.env.CHROMIUM_PATH,
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    '/usr/bin/chromium',
  ].filter(Boolean).find((p) => existsSync(p));
}

const executablePath = findChromium();
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const base = `http://127.0.0.1:${PORT}`;
const failures = [];
let passed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.error(`  FAIL ${name}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/* --- phone ---------------------------------------------------------------- */
const phone = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

await test('mobile menu opens, navigates and closes', async () => {
  const page = await phone.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });

  const toggle = page.locator('[data-nav-toggle]').first();
  assert(await toggle.isVisible(), 'menu button not visible on phone');
  assert(
    (await page.locator('#drawer').evaluate((el) => getComputedStyle(el).visibility)) === 'hidden',
    'drawer should start hidden'
  );

  await toggle.click();
  await page.waitForTimeout(500);
  assert(
    (await toggle.getAttribute('aria-expanded')) === 'true',
    'aria-expanded not set to true after opening'
  );
  assert(
    (await page.locator('#drawer').evaluate((el) => getComputedStyle(el).visibility)) === 'visible',
    'drawer did not become visible'
  );

  // Escape should close it and return focus to the button.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(450);
  assert(
    (await toggle.getAttribute('aria-expanded')) === 'false',
    'Escape did not close the menu'
  );

  await toggle.click();
  await page.waitForTimeout(450);
  await page.locator('#drawer a[href="/treatments/"]').click();
  await page.waitForURL('**/treatments/');
  assert(page.url().endsWith('/treatments/'), 'menu link did not navigate');
  await page.close();
});

await test('body scroll is locked while the menu is open', async () => {
  const page = await phone.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('[data-nav-toggle]').first().click();
  await page.waitForTimeout(400);
  const overflow = await page.evaluate(() => document.body.style.overflow);
  assert(overflow === 'hidden', `expected body overflow hidden, got "${overflow}"`);
  await page.close();
});

await test('booking bar is hidden at the top and appears after scrolling', async () => {
  const page = await phone.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  const bar = page.locator('[data-booking-bar]');
  assert(
    !(await bar.evaluate((el) => el.classList.contains('is-visible'))),
    'booking bar should be hidden over the hero'
  );

  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
  await page.waitForTimeout(500);
  assert(
    await bar.evaluate((el) => el.classList.contains('is-visible')),
    'booking bar did not appear after scrolling past the hero'
  );
  await page.close();
});

await phone.close();

/* --- desktop -------------------------------------------------------------- */
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const phoneCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

await test('category cards link to their section on the treatments page', async () => {
  const page = await desktop.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('.cats .card--link').first().click();
  await page.waitForURL('**/treatments/**');
  assert(page.url().includes('#massage'), `expected #massage anchor, got ${page.url()}`);

  const visible = await page.locator('#massage').isVisible();
  assert(visible, 'the massage section was not found on the treatments page');
  await page.close();
});

await test('jump links scroll to their category', async () => {
  const page = await desktop.newPage();
  await page.goto(`${base}/treatments/`, { waitUntil: 'networkidle' });
  await page.locator('.jump__link', { hasText: 'Beauty' }).click();
  await page.waitForTimeout(900);
  const top = await page.locator('#beauty').evaluate((el) => el.getBoundingClientRect().top);
  // Should be near the top of the viewport, below the fixed header.
  assert(top > -10 && top < 200, `beauty section at ${Math.round(top)}px after jump`);
  await page.close();
});

await test('every service row offers a WhatsApp booking link for that service', async () => {
  const page = await desktop.newPage();
  await page.goto(`${base}/treatments/`, { waitUntil: 'networkidle' });
  const rows = await page.locator('.service').count();
  const links = await page.locator('.service__book').count();
  assert(rows === links, `${rows} services but ${links} booking links`);

  const href = await page.locator('.service__book').first().getAttribute('href');
  assert(href.startsWith('https://wa.me/'), 'booking link is not a wa.me link');
  assert(
    decodeURIComponent(href).includes('Relaxing Massage'),
    'booking message does not name the service'
  );
  await page.close();
});

await test('the header becomes opaque once scrolled', async () => {
  const page = await desktop.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  const header = page.locator('[data-header]');
  assert(
    !(await header.evaluate((el) => el.classList.contains('is-stuck'))),
    'header should be transparent at the top'
  );
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(400);
  assert(
    await header.evaluate((el) => el.classList.contains('is-stuck')),
    'header did not gain its scrolled state'
  );
  await page.close();
});

await test('no revealed element stays invisible after scrolling a page', async () => {
  // A scroll reveal that never fires means content is simply missing for the
  // visitor. Worth guarding: it has happened once already, to the hero stats.
  for (const url of ['/', '/treatments/', '/about/', '/visit/']) {
    const page = await desktop.newPage();
    await page.goto(`${base}${url}`, { waitUntil: 'networkidle' });

    const screens = await page.evaluate(() =>
      Math.ceil(document.body.scrollHeight / window.innerHeight)
    );
    for (let i = 1; i <= screens; i += 1) {
      await page.evaluate((n) => window.scrollTo(0, window.innerHeight * n), i);
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(1200);

    const hidden = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-reveal]'))
        .filter((el) => parseFloat(getComputedStyle(el).opacity) < 0.99)
        .map((el) => el.className)
    );
    assert(hidden.length === 0, `${url} left ${hidden.length} element(s) hidden: ${hidden.join(', ')}`);
    await page.close();
  }
});

await test('identity accordion opens and closes with correct ARIA', async () => {
  const page = await desktop.newPage();
  await page.goto(`${base}/identity/components/`, { waitUntil: 'networkidle' });

  const trigger = page.locator('[data-accordion-trigger]').nth(1);
  const panelId = await trigger.getAttribute('aria-controls');
  const panel = page.locator(`#${panelId}`);

  assert((await trigger.getAttribute('aria-expanded')) === 'false', 'second item should start closed');
  assert((await panel.getAttribute('data-open')) === 'false', 'panel should start closed');

  await trigger.click();
  await page.waitForTimeout(500);
  assert((await trigger.getAttribute('aria-expanded')) === 'true', 'aria-expanded not set on open');
  assert((await panel.getAttribute('data-open')) === 'true', 'panel did not open');
  assert((await panel.evaluate((el) => el.getBoundingClientRect().height)) > 20, 'panel has no height when open');

  await trigger.click();
  await page.waitForTimeout(500);
  assert((await trigger.getAttribute('aria-expanded')) === 'false', 'panel did not close again');
  await page.close();
});

await test('identity drawer opens, traps scroll and closes on Escape', async () => {
  const page = await phoneCtx.newPage();
  await page.goto(`${base}/identity/`, { waitUntil: 'networkidle' });

  const toggle = page.locator('[data-nav-toggle]').first();
  assert(await toggle.isVisible(), 'drawer toggle not visible on phone');
  await toggle.click();
  await page.waitForTimeout(500);
  assert(
    (await page.locator('[data-drawer]').evaluate((el) => getComputedStyle(el).visibility)) === 'visible',
    'drawer did not open'
  );
  assert((await page.evaluate(() => document.body.style.overflow)) === 'hidden', 'body scroll not locked');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  assert((await toggle.getAttribute('aria-expanded')) === 'false', 'Escape did not close the drawer');
  await page.close();
});

await test('identity floating button appears only after the first screen', async () => {
  const page = await desktop.newPage();
  await page.goto(`${base}/identity/applied/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const fab = page.locator('[data-fab]');
  assert(!(await fab.evaluate((el) => el.classList.contains('is-visible'))), 'FAB visible at top of page');
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
  await page.waitForTimeout(500);
  assert(await fab.evaluate((el) => el.classList.contains('is-visible')), 'FAB did not appear after scrolling');
  await page.close();
});

await test('placeholder media frames actually paint', async () => {
  const page = await desktop.newPage();
  await page.goto(`${base}/identity/applied/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  const blank = await page.evaluate(() =>
    Array.prototype.filter.call(document.querySelectorAll('canvas[data-media]'), function (c) {
      // A canvas that never painted has zero backing-store size.
      return c.width < 2 || c.height < 2;
    }).length
  );
  assert(blank === 0, `${blank} placeholder frame(s) painted nothing`);
  await page.close();
});

await test('hero video plays, and only the supported format is fetched', async () => {
  const page = await desktop.newPage();
  const media = [];
  page.on('request', (r) => { if (/\.(mp4|webm)$/.test(r.url())) media.push(r.url().split('/').pop()); });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);

  const state = await page.evaluate(() => {
    const v = document.querySelector('[data-hero-video]');
    return v && { playing: v.classList.contains('is-playing'), muted: v.muted, loop: v.loop, paused: v.paused };
  });
  assert(state, 'no hero video element');
  assert(state.playing, 'hero video never started playing');
  assert(state.muted, 'hero video is not muted');
  assert(state.loop, 'hero video does not loop');
  // The browser picks the first source it supports and stops; downloading both
  // encodes would double the cost of the hero for no benefit.
  assert(media.length === 1, `expected 1 video download, got ${media.length}: ${media.join(', ')}`);
  await page.close();
});

await test('hero video is suppressed, and never downloaded, under reduced motion', async () => {
  // A decorative background video is exactly what this preference is for, and
  // skipping it has to mean skipping the bytes too — not just the playback.
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const media = [];
  page.on('request', (r) => { if (/\.(mp4|webm)$/.test(r.url())) media.push(r.url()); });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  assert(media.length === 0, `video was downloaded despite reduced motion: ${media.join(', ')}`);
  const sources = await page.evaluate(() =>
    document.querySelectorAll('[data-hero-video] source').length);
  assert(sources === 0, 'video sources were attached under reduced motion');

  // The poster still has to carry the hero on its own.
  const poster = await page.evaluate(() => {
    const img = document.querySelector('.hero__still');
    return img && img.complete && img.naturalWidth > 0;
  });
  assert(poster, 'hero poster image did not load as the fallback');
  await ctx.close();
});

await test('hero video is skipped when the visitor asked to save data', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const media = [];
  page.on('request', (r) => { if (/\.(mp4|webm)$/.test(r.url())) media.push(r.url()); });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true });
  });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  assert(media.length === 0, `video downloaded despite Save-Data: ${media.join(', ')}`);
  await ctx.close();
});

await test('the 404 page offers a way back', async () => {
  const page = await desktop.newPage();
  await page.goto(`${base}/404.html`, { waitUntil: 'networkidle' });
  assert(await page.locator('a[href="/"]').first().isVisible(), 'no link home on the 404 page');
  await page.close();
});

await desktop.close();
await phoneCtx.close();
await browser.close();
server.close();

console.log(`\n${passed} passed, ${failures.length} failed.`);
if (failures.length) process.exit(1);
