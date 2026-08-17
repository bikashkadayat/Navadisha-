/**
 * BUILD VALIDATION — runs against dist/ after `astro build`.
 * Exits non-zero on any failure, so CI fails rather than shipping the defect.
 *
 * Every check here exists because the defect it catches actually shipped:
 *   1. Meta length      — was the defect in TWO consecutive batches
 *   2. Broken links     — 13 pages pointed at an unbuilt /contact/
 *   3. Comment leakage  — 31 internal notes were public in the homepage source
 *   4. Accessibility    — single h1, alt text, skip link, labelled landmarks
 *   5. Content integrity— the honesty rules, enforced mechanically
 *
 * Run: node scripts/validate.mjs
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DIST = 'dist';

/**
 * Pages linked from the site but not yet built. Every entry is a deliberate,
 * scheduled gap — NOT a licence to leave links broken. Remove each as its page
 * lands; an empty list is the goal before launch.
 */
/**
 * Pages linked from the site but not yet built.
 *
 * EMPTY — every internal link now resolves to a built page. Keep it that way:
 * an entry here should be a deliberate, scheduled gap with a date attached, not
 * a place to park a broken link.
 */
const QUEUED = [];

/** Phrases that must never appear. Each maps to an approved content rule. */
const FORBIDDEN = [
  { pattern: /trusted by/i, why: 'unverifiable trust claim' },
  { pattern: /\bhappy clients?\b/i, why: 'client-count claim' },
  { pattern: /clients? served/i, why: 'client-count claim' },
  { pattern: /years of experience/i, why: 'unverifiable experience claim' },
  { pattern: /\b\d{2,}\+\s*(clients|projects|students|schools|colleges)/i, why: 'inflated count' },
  { pattern: /award[- ]winning/i, why: 'unverifiable award claim' },
  { pattern: /industry[- ]leading/i, why: 'unverifiable superlative' },
  { pattern: /world[- ]class/i, why: 'banned superlative' },
  { pattern: /guarantee(d)? (enrol|admission|placement|job)/i, why: 'prohibited guarantee' },
];

const errors = [];
const warnings = [];

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(p)));
    else if (entry.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const strip = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&nbsp;/g, ' ');

const files = await htmlFiles(DIST);
const routes = new Set(
  files.map((f) => '/' + relative(DIST, f).replace(/index\.html$/, '').replace(/\\/g, '/')),
);

for (const file of files) {
  const html = await readFile(file, 'utf8');
  const route = '/' + relative(DIST, file).replace(/index\.html$/, '').replace(/\\/g, '/');
  const fail = (msg) => errors.push(`${route} — ${msg}`);
  const warn = (msg) => warnings.push(`${route} — ${msg}`);

  // ── 1. Meta ────────────────────────────────────────────────────────────
  const title = strip(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '');
  const desc = strip(html.match(/name="description" content="([^"]*)"/)?.[1] ?? '');

  if (!title) fail('missing <title>');
  else if (title.length > 60) fail(`title ${title.length} chars, limit 60 — "${title}"`);

  if (!desc) fail('missing meta description');
  else if (desc.length > 155) fail(`meta description ${desc.length} chars, limit 155`);
  else if (desc.length < 70) warn(`meta description only ${desc.length} chars — thin`);

  if (!/rel="canonical"/.test(html)) fail('missing canonical');
  if (!/property="og:title"/.test(html)) fail('missing og:title');

  // ── 2 + 3. Internal links ──────────────────────────────────────────────
  const hrefs = [...html.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1]);
  for (const href of new Set(hrefs)) {
    const normalised = href.endsWith('/') ? href : `${href}/`;
    if (routes.has(normalised)) continue;
    if (href.startsWith('/fonts/') || href.startsWith('/brand/')) continue;
    if (href.startsWith('/_astro/') || /\.(css|js|xml|png|jpg|svg|webp|ico|woff2)$/.test(href)) continue;
    if (QUEUED.includes(normalised)) {
      warn(`link to queued page ${normalised}`);
      continue;
    }
    fail(`BROKEN LINK → ${href}`);
  }

  // ── 4. Comment leakage ─────────────────────────────────────────────────
  const comments = html.match(/<!--(?!\[if)[\s\S]*?-->/g) ?? [];
  if (comments.length) {
    fail(`${comments.length} HTML comment(s) leaked into public source`);
  }

  // ── 5. Accessibility ───────────────────────────────────────────────────
  const h1s = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1s !== 1) fail(`${h1s} <h1> elements, expected exactly 1`);

  const imgsNoAlt = (html.match(/<img(?![^>]*\balt=)[^>]*>/g) ?? []).length;
  if (imgsNoAlt) fail(`${imgsNoAlt} <img> without alt`);

  if (!/class="skip-link"/.test(html)) fail('missing skip link');
  if (!/<main[\s>]/.test(html)) fail('missing <main> landmark');
  if (!/lang="[a-z]{2}"/.test(html)) fail('missing lang attribute');

  const navs = (html.match(/<nav(?![^>]*aria-label)[^>]*>/g) ?? []).length;
  if (navs) fail(`${navs} <nav> without aria-label`);

  // Heading-level skips
  const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) {
      warn(`heading level skip h${levels[i - 1]} → h${levels[i]}`);
      break;
    }
  }

  // ── 6. Content integrity ───────────────────────────────────────────────
  const text = strip(html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' '));
  for (const { pattern, why } of FORBIDDEN) {
    const global = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
    for (const hit of text.matchAll(global)) {
      // Look back for a negation. A page that says "we do not guarantee
      // enrolment" is honouring the rule, not breaking it.
      const before = text.slice(Math.max(0, hit.index - 60), hit.index).toLowerCase();
      if (/\b(do not|don't|does not|doesn't|never|no)\s+[\w\s]{0,20}$/.test(before)) continue;
      fail(`FORBIDDEN CONTENT (${why}): "${hit[0]}"`);
    }
  }
}

// ── Report ───────────────────────────────────────────────────────────────
const line = '─'.repeat(64);
console.log(`\n${line}\nBUILD VALIDATION — ${files.length} pages\n${line}`);

if (warnings.length) {
  console.log(`\n⚠  ${warnings.length} warning(s):`);
  warnings.forEach((w) => console.log(`   ${w}`));
}

if (errors.length) {
  console.log(`\n✖  ${errors.length} error(s):`);
  errors.forEach((e) => console.log(`   ${e}`));
  console.log(`\n${line}\nFAILED\n`);
  process.exit(1);
}

console.log(`\n✔  All checks passed.\n${line}\n`);
