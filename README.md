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

## Launch gates — all met

Verified by real Lighthouse runs against a served build, not estimated.

| Gate | Target | Measured |
|---|---|---|
| Accessibility | WCAG 2.2 AA | **100** on every page tested, desktop and mobile |
| Performance | LCP < 2.5s on 4G | **1.7–1.8s** mobile, 0.4s desktop |
| CLS / TBT | < 0.1 / < 200ms | **0** and **0ms** |
| JavaScript | < 25KB | **~4.25KB** site-wide |
| Third-party requests | 0 | **0** |
| Honesty | No unverified claims | Enforced by `scripts/validate.mjs` |

---

## Validation

`npm run build` runs `astro build` **and** `scripts/validate.mjs`. A non-zero
exit fails the build, so none of the following can reach production:

- meta title > 60 or description > 155 characters
- an internal link with no corresponding built page
- an HTML comment leaked into public page source
- a page without exactly one `h1`, a skip link, `<main>`, `lang`, or with an
  unlabelled `<nav>`
- an image without `alt`
- any of nine forbidden content patterns — "trusted by", client counts,
  "award-winning", unverifiable guarantees

Each check exists because the defect it catches actually shipped.

---

## Status — feature-complete for launch scope

**24 pages built. Nothing deployed.** The directory is not yet a git repository.

Deployment documentation is in [`deploy/`](./deploy/) — eight documents covering
repository initialisation, the Worker, domain cutover, DNS, email verification,
a launch-day runbook and rollback.

### Blocking launch

| # | Item | Effort |
|---|---|---|
| 1 | Deploy the Cloudflare Worker | ~30 min |
| 2 | Verify the sending domain for `contact@navadisha.com.np` | ~15 min |
| 3 | Set `SITE_URL` and `PUBLIC_FORM_ENDPOINT` repository variables | ~5 min |
| 4 | Confirm `contact@navadisha.com.np` **receives** mail | ~15 min |

Items 1 and 2 are one job — doing the first without the second produces a form
that stores leads correctly but never confirms receipt to the sender.

### Known and accepted

- **Favicon illegible at 32px** — the supplied mark is 3D raster. Not fixable by
  resampling; needs the SVG redraw specified in [`brand/LOGO-SPEC.md`](./brand/LOGO-SPEC.md).
- **No team photography** — initials fallback is designed for, upgrades by
  populating one field.
- **No analytics** — deliberate, and the privacy policy says so.
- **Registration pending** — stated honestly on three pages; blocks public
  tenders only.
- **NIF case study has no metric** — the page states this rather than estimating.
