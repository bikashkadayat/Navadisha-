/**
 * Visual surface audit.
 *
 * Measures how much of a rendered page is DARK, by pixel area rather than by
 * section count — because visual weight is what a visitor perceives, and a
 * full-viewport hero counts for far more than a short band.
 *
 * Forces prefers-color-scheme: light, because headless Chrome defaults to dark
 * and the site correctly inverts under it, which measures the opposite of what
 * we want.
 *
 * Usage: node scripts/visual-audit.mjs <url> [label]
 */
import puppeteer from 'puppeteer-core';
import { writeFile } from 'node:fs/promises';

const URL = process.argv[2] ?? 'http://localhost:4321/';
const LABEL = process.argv[3] ?? 'audit';
const OUT = process.env.OUT_DIR ?? '/tmp';

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });

// Per-section geometry and computed background — the analytical view.
const sections = await page.evaluate(() => {
  const lum = (rgb) => {
    const m = rgb.match(/\d+/g);
    if (!m) return 255;
    const [r, g, b] = m.map(Number);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const out = [];
  document.querySelectorAll('section, header, footer').forEach((el) => {
    const r = el.getBoundingClientRect();
    const bg = getComputedStyle(el).backgroundColor;
    out.push({
      tag: el.tagName.toLowerCase(),
      tone: el.dataset.tone ?? null,
      top: Math.round(r.top + window.scrollY),
      height: Math.round(r.height),
      bg,
      lum: Math.round(lum(bg)),
    });
  });
  return {
    docHeight: document.documentElement.scrollHeight,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    sections: out,
  };
});

const shot = `${OUT}/${LABEL}.png`;
await page.screenshot({ path: shot, fullPage: true });
await browser.close();

// ── Analytical: dark area by computed background luminance ────────────────
const DARK = 128; // 0-255
let darkPx = 0;
let total = 0;
for (const s of sections.sections) {
  if (s.tag !== 'section' && s.tag !== 'footer') continue; // header overlays
  total += s.height;
  if (s.lum < DARK) darkPx += s.height;
}

console.log(`\n══ ${LABEL} — ${URL} ══`);
console.log(`document height : ${sections.docHeight}px`);
console.log(`body background : ${sections.bodyBg}`);
console.log(`\nsection          tone      height     lum   surface`);
console.log('─'.repeat(58));
for (const s of sections.sections) {
  if (s.tag === 'header') continue;
  const kind = s.lum < DARK ? 'DARK' : s.lum > 240 ? 'white' : 'light-grey';
  console.log(
    `${s.tag.padEnd(8)} ${String(s.tone ?? '—').padEnd(9)} ${String(s.height).padStart(6)}px  ${String(s.lum).padStart(4)}   ${kind}`,
  );
}
console.log('─'.repeat(58));
console.log(`DARK  : ${((100 * darkPx) / total).toFixed(1)}%  (${darkPx}px of ${total}px)`);
console.log(`LIGHT : ${((100 * (total - darkPx)) / total).toFixed(1)}%`);

// Above-the-fold, the impression that actually forms
let foldDark = 0;
for (const s of sections.sections) {
  if (s.tag === 'header') continue;
  const visible = Math.max(0, Math.min(900, s.top + s.height) - Math.max(0, s.top));
  if (s.lum < DARK) foldDark += visible;
}
console.log(`FIRST VIEWPORT (900px): ${((100 * foldDark) / 900).toFixed(1)}% dark`);
console.log(`screenshot: ${shot}\n`);

await writeFile(`${OUT}/${LABEL}.json`, JSON.stringify(sections, null, 2));
