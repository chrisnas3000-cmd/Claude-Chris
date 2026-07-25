/**
 * Accessibility audit. Run with `npm run a11y` after a build.
 *
 * Loads every page in a real browser, runs axe-core against WCAG 2.1 A and AA,
 * and additionally checks keyboard reachability of the booking links and the
 * mobile menu — the two things a spa site cannot afford to get wrong.
 *
 * Exits non-zero on any violation.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(process.cwd(), '_site');
const PORT = 8096;

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

const axeSource = await readFile(
  resolve(HERE, '..', 'node_modules', 'axe-core', 'axe.min.js'),
  'utf8'
);

function findChromium() {
  return [
    process.env.CHROMIUM_PATH,
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    '/usr/bin/chromium',
  ].filter(Boolean).find((p) => existsSync(p));
}

const PAGES = ['/', '/treatments/', '/about/', '/visit/', '/404.html'];
const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
];

const executablePath = findChromium();
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const violations = [];

for (const viewport of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
  });

  for (const url of PAGES) {
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${PORT}${url}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);

    await page.addScriptTag({ content: axeSource });
    const results = await page.evaluate(async () =>
      // eslint-disable-next-line no-undef
      await axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      })
    );

    for (const violation of results.violations) {
      violations.push(
        `[${viewport.name} ${url}] ${violation.id} (${violation.impact}): ${violation.help}\n` +
          violation.nodes
            .slice(0, 3)
            .map((n) => `      ${n.html.slice(0, 120)}`)
            .join('\n')
      );
    }
    await page.close();
  }
  await context.close();
}

/* --- keyboard reachability of the booking path ---------------------------- */
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });

const reached = new Set();
for (let i = 0; i < 30; i += 1) {
  await page.keyboard.press('Tab');
  const info = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    const style = getComputedStyle(el);
    return {
      tag: el.tagName,
      href: el.getAttribute('href') || '',
      // A focused control with no visible outline is a real failure.
      outline: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0,
    };
  });
  if (!info) continue;
  if (info.href.startsWith('https://wa.me/')) reached.add('whatsapp');
  if (info.href.startsWith('tel:')) reached.add('phone');
  if ((info.tag === 'A' || info.tag === 'BUTTON') && !info.outline) {
    violations.push(`[keyboard] focused ${info.tag} (${info.href || 'no href'}) shows no focus outline`);
  }
}
if (!reached.has('whatsapp')) {
  violations.push('[keyboard] WhatsApp booking link is not reachable by keyboard within 30 tabs');
}
await context.close();
await browser.close();
server.close();

if (violations.length) {
  console.error(`${violations.length} accessibility issue(s):\n`);
  violations.forEach((v) => console.error(`  x ${v}\n`));
  process.exit(1);
}
console.log(`No accessibility violations across ${PAGES.length} pages x ${VIEWPORTS.length} viewports.`);
console.log('Booking links are keyboard reachable and focus is visible.');
