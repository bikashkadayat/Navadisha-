// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/**
 * Strip HTML comments from rendered Markdown.
 *
 * Editorial notes in content files (⚠ COPY STATUS, TODO markers) are valuable
 * to the team and must NEVER reach public page source — Astro passes Markdown
 * HTML comments straight through to the output. Caught by scripts/validate.mjs
 * on three service pages.
 */
/** Remark stage — where Markdown HTML comments actually live (mdast `html`). */
function remarkStripComments() {
  return (tree) => {
    const walk = (node) => {
      if (!node.children) return;
      node.children = node.children.filter((c) => {
        if (c.type !== 'html' || typeof c.value !== 'string') return true;
        c.value = c.value.replace(/<!--[\s\S]*?-->/g, '');
        return c.value.trim().length > 0;
      });
      node.children.forEach(walk);
    };
    walk(tree);
  };
}

function rehypeStripComments() {
  return (tree) => {
    const walk = (node) => {
      if (!node.children) return;
      node.children = node.children.filter((c) => {
        // Astro passes Markdown HTML through as `raw` nodes, not `comment`
        // nodes, so both cases must be handled.
        if (c.type === 'comment') return false;
        if (c.type === 'raw' && typeof c.value === 'string') {
          c.value = c.value.replace(/<!--[\s\S]*?-->/g, '');
          if (!c.value.trim()) return false;
        }
        return true;
      });
      node.children.forEach(walk);
    };
    walk(tree);
  };
}

// SITE: confirmed production origin (client, Aug 2026).
// Custom domain fronted by Cloudflare => base stays '/'.
const SITE = process.env.SITE_URL ?? 'https://navadisha.bikashkadayat.com.np';

export default defineConfig({
  site: SITE,
  base: '/',
  trailingSlash: 'always',        // matches the permanent URL contract in the Phase-0 doc §5.5
  build: {
    format: 'directory',          // /services/web-development/index.html
    inlineStylesheets: 'auto',
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/404') &&
        !page.includes('/thank-you'),
    }),
  ],
  markdown: {
    // Two stages, deliberately. A Markdown HTML comment lives as an mdast
    // `html` node and never becomes a hast `comment`, so the rehype pass alone
    // does not catch it — the remark pass is the one that actually works here.
    // Both are kept: defence in depth on a rule that must not fail silently.
    remarkPlugins: [remarkStripComments],
    rehypePlugins: [rehypeStripComments],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
