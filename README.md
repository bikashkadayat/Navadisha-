# Navadisha

Website for **NAVADISHA Consulting & Innovations Pvt. Ltd.** — a Kathmandu
consulting practice working across education and technology.

**Production:** https://navadisha.bikashkadayat.com.np
**Stack:** Astro · Tailwind CSS v4 · GitHub Pages · Cloudflare · Cloudflare Worker

---

## Project overview

24 static pages across seven sections — institutions, students, services,
programmes, work, about and contact — plus a Cloudflare Worker handling contact
form submissions.

| | |
|---|---|
| Pages | 24 |
| JavaScript shipped | ~4.25 KB site-wide |
| Third-party requests | 0 — fonts self-hosted, no analytics, no embeds |
| Cookies set | 0 — no consent banner needed |
| Lighthouse | Performance 99–100 · **Accessibility 100** · Best practices 100 · SEO 100 |
| Mobile LCP | 1.7–1.8 s · CLS 0 · TBT 0 ms |

### Architecture

```
src/
├── content.config.ts     schema definitions — these ARE the Phase-2 Django models
├── content/              all site copy (services, work, team, programmes)
├── data/
│   ├── company.ts        contact + registration status — single source of truth
│   ├── nav.ts            navigation structure
│   ├── programs.ts       programme lines + status taxonomy
│   ├── institutions.ts   institution segments
│   └── schema.ts         JSON-LD helpers
├── styles/
│   ├── tokens.css        two-layer design tokens — a rebrand happens HERE, only here
│   ├── fonts.css         generated; self-hosted WOFF2
│   └── global.css        base styles, inverse-band scope, motion rules
├── layouts/Base.astro    metadata, JSON-LD, skip link, header/footer
├── components/           31 components, all data-driven
└── pages/                24 routes
worker/                   Cloudflare Worker — contact form relay
scripts/
├── validate.mjs          build validation — fails the build on any violation
└── build-brand.mjs       one-off asset + font pipeline
docs/                     deployment, operations, launch, security
```

### Four disciplines

Break any of these and the Phase-2 Django migration stops being a swap.

1. **Components never touch raw palette steps.** They read semantic tokens
   (`--text-primary`, `--action-primary-default`). Need a colour with no
   semantic token? Add the token.
2. **Components read from collections.** No content hard-coded in markup. In
   Phase 2 the data source changes and the templates do not.
3. **URLs are permanent.** `/insights/` never becomes `/blog/`.
4. **Component props are data objects.** `<CaseStudyCard caseStudy={x} />`, not
   fifteen string props.

---

## Local development

**Node 22 is required** and pinned in `.nvmrc` — Vite 8 rejects anything below
20.19.

```bash
nvm use          # reads .nvmrc
npm ci
npm run dev      # http://localhost:4321
```

---

## Build commands

| Command | Does |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | **Production build + validation.** Fails on any violation. |
| `npm run preview` | Serve the built output |
| `npm run validate` | Run validation alone against an existing `dist/` |
| `npm run check` | Type-check and validate content schemas |
| `node scripts/build-brand.mjs` | Regenerate brand assets and self-hosted fonts |

### What validation enforces

`npm run build` runs `astro build` **and** `scripts/validate.mjs`. A non-zero
exit fails the build, so none of these can reach production:

- Meta title > 60 or description > 155 characters
- An internal link with no corresponding built page
- An HTML comment leaked into public page source
- A page without exactly one `h1`, a skip link, `<main>`, `lang`, or with an
  unlabelled `<nav>`
- An `<img>` without `alt`
- Any of nine forbidden content patterns — "trusted by", client counts,
  "award-winning", unverifiable guarantees

Each check exists because the defect it catches actually shipped.

---

## Deployment commands

Push to `main`. GitHub Actions builds, validates and deploys.

```bash
git push origin main
```

Full procedure: **[`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)**

### Worker

```bash
cd worker
npx wrangler login
npx wrangler kv namespace create LEADS     # paste the id into wrangler.toml
npx wrangler secret put RESEND_API_KEY
npx wrangler deploy
npx wrangler tail                          # live logs
```

Full procedure: **[`worker/DEPLOYMENT.md`](./worker/DEPLOYMENT.md)**

> ⚠️ **Never delete the `LEADS` KV namespace or bulk-delete `lead:` keys.** It
> is the enquiry history and the Phase-2 CRM's seed data. There is no undo.

### Cache purge

Astro fingerprints CSS and JS filenames, so those invalidate themselves. **HTML
does not** — purge changed URLs at Cloudflare after a content deploy. See
[`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md#cache-purge).

---

## Environment variables

Copy `.env.example` to `.env`. `.env` is git-ignored.

| Variable | Scope | Purpose |
|---|---|---|
| `SITE_URL` | Build | Production origin. Drives canonicals, OG tags, sitemap. |
| `PUBLIC_FORM_ENDPOINT` | Build, **public** | Worker endpoint. Empty = form disabled but graceful. |
| `PUBLIC_TURNSTILE_SITE_KEY` | Build, **public** | Optional CAPTCHA site key |
| `CLOUDFLARE_ACCOUNT_ID` | CLI | wrangler convenience |
| `CLOUDFLARE_KV_NAMESPACE` | CLI | KV namespace id |
| `NOTIFY_EMAIL` | Reference | Where enquiries are delivered |

**`PUBLIC_*` values are compiled into the client bundle and readable by anyone
who views source.** Never put a secret behind that prefix.

Real secrets — `RESEND_API_KEY`, `TURNSTILE_SECRET` — are set with
`wrangler secret put` and stored encrypted at Cloudflare. They never appear in
`.env`, `wrangler.toml` or the repository.

In CI these come from **repository variables**, not from `.env`:
`Settings → Secrets and variables → Actions → Variables`.

---

## Documentation

| Document | Covers |
|---|---|
| [`docs/FINAL-AUDIT-REPORT.md`](./docs/FINAL-AUDIT-REPORT.md) | **Readiness score, risks, launch decision** |
| [`docs/PRODUCTION-DEPLOYMENT.md`](./docs/PRODUCTION-DEPLOYMENT.md) | Pre-deployment, deployment, post-deployment, rollback |
| [`docs/LAUNCH-DAY-RUNBOOK.md`](./docs/LAUNCH-DAY-RUNBOOK.md) | Timed launch procedure, smoke tests, emergency rollback |
| [`docs/COMMANDS.md`](./docs/COMMANDS.md) | **Copy-paste terminal reference** — deploy, verify, roll back |
| [`docs/POST-LAUNCH-MONITORING.md`](./docs/POST-LAUNCH-MONITORING.md) | Cadence, thresholds, trigger-based updates |
| [`docs/DEPLOYMENT-AUDIT.md`](./docs/DEPLOYMENT-AUDIT.md) | Config audit — astro.config, CNAME, robots, sitemap, canonicals, OG |
| [`docs/DNS-VERIFICATION.md`](./docs/DNS-VERIFICATION.md) | DNS, SSL, HTTPS, redirects, proxy, HSTS |
| [`docs/EMAIL-SETUP.md`](./docs/EMAIL-SETUP.md) | Sender setup, domain verification, SPF, DKIM, DMARC |
| [`docs/WORKER-DEPLOYMENT-CHECKLIST.md`](./docs/WORKER-DEPLOYMENT-CHECKLIST.md) | Worker audit + verification gate |
| [`docs/OPERATIONS.md`](./docs/OPERATIONS.md) | Updating content, programmes, case studies, articles, navigation |
| [`docs/SECURITY-REVIEW.md`](./docs/SECURITY-REVIEW.md) | CSP, headers, HSTS, form abuse, Turnstile |
| [`worker/DEPLOYMENT.md`](./worker/DEPLOYMENT.md) | Worker procedure — wrangler, KV, secrets, testing |
| [`brand/README.md`](./brand/README.md) | Brand assets, palette, typography |
| [`brand/LOGO-SPEC.md`](./brand/LOGO-SPEC.md) | SVG logo redraw requirements |
| [`src/content/README.md`](./src/content/README.md) | Content authoring guide |

---

## Status

**Feature-complete for launch scope.** Repository initialised and pushed to
[`bikashkadayat/Navadisha-`](https://github.com/bikashkadayat/Navadisha-).
**Not yet live on the custom domain.**

### Blocking launch

| # | Item | Effort |
|---|---|---|
| 1 | Confirm `contact@navadisha.com.np` **receives** mail | ~15 min |
| 2 | Deploy the Worker | ~30 min |
| 3 | Verify the sending domain (SPF, DKIM, DMARC) | ~15 min |
| 4 | Set `SITE_URL` and `PUBLIC_FORM_ENDPOINT` repository variables | ~5 min |
| 5 | Pages source → **GitHub Actions**; add the custom domain | ~5 min |

Items 2 and 3 are one job. Doing the first without the second produces a form
that stores leads correctly but never confirms receipt to the sender.

### Known and accepted

- **Favicon illegible at 32px** — the supplied mark is 3D raster. Not fixable by
  resampling; needs the SVG redraw in [`brand/LOGO-SPEC.md`](./brand/LOGO-SPEC.md).
- **No security response headers yet** — GitHub Pages cannot set them; add a
  Cloudflare Transform Rule. See [`docs/SECURITY-REVIEW.md`](./docs/SECURITY-REVIEW.md).
- **No team photography** — initials fallback is designed for; upgrades by
  populating one field.
- **No analytics** — deliberate, and the privacy policy says so.
- **Registration pending** — stated honestly on three pages.
- **NIF case study has no metric** — the page states this rather than estimating.
