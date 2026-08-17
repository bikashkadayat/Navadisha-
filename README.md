# Navadisha — Phase-1 website

Static site for **Navadisha Consulting & Innovations Pvt. Ltd.**
Astro + Tailwind → GitHub Pages, Cloudflare in front.

Strategy, IA and UX decisions live in the Phase-0 dossier. This README covers
running the thing.

---

## Quick start

Node is pinned to 22 (`.nvmrc`) — Vite 8 requires ≥ 20.19, and the system Node
here is 20.12.

```bash
nvm use            # reads .nvmrc
npm ci
npm run dev        # http://localhost:4321
```

| Command | Does |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the built output |
| `npm run check` | Type-check and validate content schemas |

---

## Layout

```
src/
├── content.config.ts     ← collection schemas = Phase-2 Django models
├── content/              ← all site copy (see content/README.md)
├── data/
│   ├── company.ts        ← compliance + contact, single source of truth
│   └── nav.ts            ← navigation structure
├── styles/
│   ├── tokens.css        ← THE token file — rebrand happens here, only here
│   └── global.css
├── layouts/Base.astro    ← metadata, JSON-LD, skip link, header/footer
├── components/
└── pages/
worker/                   ← Cloudflare form relay (see §12.2)
```

---

## The four disciplines

Break any of these and the Phase-2 Django migration stops being a swap.

**1. Components never touch raw palette steps.** They read semantic tokens
(`--text-primary`, `--action-primary-default`). If you need a colour that has no
semantic token, add the token — do not reach into `--color-base-700`. The
identity is not yet approved (blocker #1); when it lands, only layer 1 of
`tokens.css` changes and no component is touched.

**2. Components read from collections.** No content hard-coded in markup. In
Phase 2 the data source changes and the templates do not.

**3. URLs are permanent.** `/insights/` never becomes `/blog/`, so the Phase-2
blog inherits accumulated SEO equity instead of starting cold.

**4. Component props are data objects.** `<CaseStudyCard caseStudy={x} />`, not
fifteen string props. The component must not know or care where `x` came from.

---

## Deployment

Push to `main` → GitHub Actions builds and deploys to Pages
(`.github/workflows/deploy.yml`). Cloudflare provides DNS, CDN, WAF and
analytics in front of it.

Forms post to the Cloudflare Worker in `worker/`, **not** to Pages — static
hosting has no server to receive a POST.

```bash
cd worker
npx wrangler kv namespace create LEADS   # paste the id into wrangler.toml
npx wrangler secret put TURNSTILE_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler deploy
```

The Worker's `LeadPayload` interface deliberately mirrors the Phase-2 Django
`Lead` model. When Django goes live the frontend changes one constant — the
endpoint URL — and nothing else. **Do not clear the `LEADS` namespace:** it is
the CRM's seed data, and it is the reason forms are not outsourced to Formspree.

---

## Launch gates

Not follow-up tasks. All three are dramatically cheaper now than as remediation.

- **WCAG 2.2 AA** — 4.5:1 contrast, keyboard operable, visible focus, 44px
  targets, `prefers-reduced-motion` honoured, tested at 200% zoom and 320px.
- **Performance** — LCP < 2.5s on **throttled 4G, not desktop fibre**. Content
  pages < 500KB, homepage < 800KB. Nepal-specific: this is a functional
  requirement, not an optimisation.
- **Honesty** — every number, logo, quote and metric real. Sections without real
  content remove themselves; that behaviour is built in, not remembered.

---

## Status

**Foundation complete and building.** Token architecture, all eight content
collection schemas, layout, header with data-driven mega-panel, footer with
gated compliance block, service index and detail templates, homepage with its
eleven sections and the automatic honesty fallbacks, form Worker, CI pipeline.

**Blocked on client input**, not on engineering:

| # | Needed | Blocks |
|---|---|---|
| 1 | Visual identity | Real palette and type in `tokens.css` |
| 2 | Registration no., PAN/VAT, registered address | Footer compliance block, LocalBusiness schema |
| 3 | Team names, roles, credentials, photos | `/about/team/` — the page that closes deals |
| 4 | Proof inventory (real clients, consented quotes) | Homepage S5/S8, `work/`, `testimonials/` |
| 5 | Content ownership for ~40,000 words | 10 remaining services, programmes, insights |
| 6 | Confirmed domain | `astro.config.mjs`, Worker CORS |
| 7 | Phone, WhatsApp, email, address, hours | `company.ts`, every CTA |
| 9 | Which programmes actually run, with named trainers | `programs/` |

Placeholders are deliberately **absent** rather than invented. The footer prints
a visible warning in dev and renders nothing in production until real data
arrives — publishing a fabricated registration number would be worse than
publishing none.
# Navadisha-
