# Production deployment

**Target:** `https://navadisha.bikashkadayat.com.np`
**Origin:** GitHub Pages — [`bikashkadayat/Navadisha-`](https://github.com/bikashkadayat/Navadisha-), branch `main`
**Edge:** Cloudflare (proxied)
**Form backend:** Cloudflare Worker

Configuration audit: [DEPLOYMENT-AUDIT.md](./DEPLOYMENT-AUDIT.md) — all checks pass.

---

## Architecture

```
Visitor
   │ HTTPS
   ▼
Cloudflare edge   CDN · WAF · Brotli · TLS
   │ HTTPS (Full strict)
   ▼
GitHub Pages      static artifact, built by Actions from main
   │
   └─ POST /api/contact ─► Cloudflare Worker ─► KV (leads)
                                            └─► transactional email
```

Static hosting has no server, which is why the form posts to a Worker.

---

## Pre-Deployment

### A · Blockers — do not deploy without these

- [ ] **`contact@navadisha.com.np` receives mail.** Send a test from an
      unrelated account. *Sending and receiving are different services* — see
      [EMAIL-SETUP](./EMAIL-SETUP.md). The address is on nine pages and is the
      destination for every form submission.
- [ ] **Worker deployed** — [WORKER-DEPLOYMENT-CHECKLIST](./WORKER-DEPLOYMENT-CHECKLIST.md)
- [ ] **Sending domain verified** — SPF, DKIM, DMARC
- [ ] **Repository variables set** — `SITE_URL`, `PUBLIC_FORM_ENDPOINT`
- [ ] **Pages source = GitHub Actions**, custom domain added

### B · Repository

Already done: initialised on `main`, pushed, 111 files tracked, `.env` and
`node_modules` correctly excluded.

- [ ] Commit and push the deployment-assets change set
- [ ] **Settings → Pages → Source: `GitHub Actions`** (not a branch)
- [ ] **Settings → Pages → Custom domain:** `navadisha.bikashkadayat.com.np`
- [ ] **Settings → Variables → Actions:**

| Variable | Value |
|---|---|
| `SITE_URL` | `https://navadisha.bikashkadayat.com.np` |
| `PUBLIC_FORM_ENDPOINT` | Worker URL, once deployed |
| `PUBLIC_TURNSTILE_SITE_KEY` | Optional |

> These are **variables, not secrets** — public values compiled into the client
> bundle. Storing them as secrets makes them harder to read without making them
> any less public.

- [ ] Actions run green: `24 page(s) built` + `✔ All checks passed`
- [ ] **Verify at `bikashkadayat.github.io/Navadisha-/` before touching DNS** —
      cheapest smoke test, and it separates build problems from domain problems

### C · Cloudflare

| Setting | Value | Why |
|---|---|---|
| SSL/TLS mode | **Full (strict)** | Flexible reaches the origin over plain HTTP — infinite redirect loop with GitHub's HTTPS enforcement, and insecure regardless |
| Always Use HTTPS | On | |
| Minimum TLS | 1.2 | |
| Brotli | **On** | Without it Lighthouse deducts for text compression |
| Early Hints | On | Free LCP improvement |
| Auto Minify | **Off** | Astro already minifies |
| Rocket Loader | **Off** | Reorders scripts — **breaks the nav and form** |
| Email Obfuscation | **Off** | Rewrites `mailto:` — breaks the contact page |

> **Rocket Loader and Auto Minify are the two settings most likely to silently
> break this site.** Symptoms — dead menu, dead form, unstyled pages — do not
> obviously point at a CDN setting.

- [ ] Security headers Transform Rule — [SECURITY-REVIEW](./SECURITY-REVIEW.md)
- [ ] HSTS at `max-age=86400` to start

### D · Content and QA

- [ ] Every page read once, aloud
- [ ] Phone, email, address correct everywhere
- [ ] Real mid-range Android: scroll, mobile menu, form
- [ ] Dark mode on a device set to dark
- [ ] Screen-reader pass over the form and navigation

---

## Deployment

### Step 1 — Push

```bash
nvm use && npm run build      # verify locally FIRST
git push origin main
```

Actions runs `npm ci` then `npm run build`, which executes **both**
`astro build` and `scripts/validate.mjs`. A validation failure exits non-zero
and **fails the deploy** — a broken link or over-length meta description never
reaches production.

- [ ] Actions green: `24 page(s) built` + `✔ All checks passed`

### Step 2 — Certificate

> ⚠️ **Your DNS proxy is already enabled.** GitHub cannot complete domain
> validation through a Cloudflare proxy. If its certificate has not been issued,
> this is where launches go wrong — and the errors do not point at the cause.

If the certificate is pending or failing:

```
1  Cloudflare → set the record to DNS-only (grey cloud)
2  Wait ~5 minutes
3  GitHub → Settings → Pages → check certificate status
      still pending? remove the custom domain, wait 5 min, re-add
4  WAIT for "Certificate issued"        ← do not proceed early
5  GitHub → enable "Enforce HTTPS"
6  Cloudflare → SSL/TLS → Full (strict) ← BEFORE re-proxying
7  Cloudflare → switch back to proxied (orange cloud)
```

- [ ] GitHub shows **"Certificate issued"**
- [ ] **Enforce HTTPS** enabled
- [ ] Proxy on, SSL/TLS Full (strict)

### Step 3 — Wire the form

- [ ] `PUBLIC_FORM_ENDPOINT` set to the Worker URL
- [ ] Workflow re-run — **the endpoint is compiled in at build time**

---

## Post-Deployment

### Immediate verification

Full procedure in [LAUNCH-DAY-RUNBOOK](./LAUNCH-DAY-RUNBOOK.md#smoke-testing).

```bash
curl -I https://navadisha.bikashkadayat.com.np                       # 200
curl -I http://navadisha.bikashkadayat.com.np                        # 301 → https
curl -s -o /dev/null -w "%{http_code}\n" https://navadisha.bikashkadayat.com.np/nope/   # 404
curl -s https://navadisha.bikashkadayat.com.np/robots.txt
curl -sI https://navadisha.bikashkadayat.com.np | grep -i cf-cache-status
```

- [ ] Homepage loads over HTTPS, no certificate warning
- [ ] Ten pages spot-checked across every section
- [ ] `/sitemap-index.xml` and `/robots.txt` return 200
- [ ] A bad URL returns the 404 page
- [ ] Canonical tags show the live host
- [ ] **Form submits and both emails arrive**
- [ ] Lead appears in KV
- [ ] Lighthouse against the live URL — Brotli deduction gone

### Search and discovery

- [ ] Google Search Console verified, sitemap submitted
- [ ] Google Business Profile created — Baneshwar address
- [ ] Name, address, phone identical across site, GBP and directories

### Cache purge

Astro fingerprints CSS and JS filenames, so those invalidate themselves.
**HTML does not.**

| Change | Purge? |
|---|---|
| Content edit deployed via Actions | **Yes** — purge the affected URLs |
| CSS or JS change | No — fingerprinted |
| New image in `public/` | No |
| Replaced image at the same filename | **Yes** |
| `robots.txt` or sitemap | **Yes** |

Dashboard → **Caching → Configuration → Purge Custom Purge → by URL**. Prefer
this over Purge Everything, which evicts globally and makes the next visitor in
each region pay full origin latency.

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" \
  --data '{"files":["https://navadisha.bikashkadayat.com.np/about/team/"]}'
```

Verify with `cf-cache-status` — `MISS` or `EXPIRED` right after a purge is
correct; `HIT` means it did not take.

### First week

- [ ] Search Console — indexing progress, no crawl errors
- [ ] Check KV daily for leads
- [ ] Confirm acknowledgement emails are not filtered to spam
- [ ] Raise HSTS to `max-age=31536000`
- [ ] Add CSP in `Report-Only`, watch for a week
- [ ] Raise DNS TTL from 300s to 3600s

---

## Rollback

| Layer | Action | Time | Data loss |
|---|---|---|---|
| Bad content | `git revert HEAD && git push` | ~3 min | None |
| Bad deploy | Actions → last good run → **Re-run all jobs** | ~2 min | None |
| DNS | Revert the record | TTL | None |
| Cloudflare setting | Toggle back | Seconds | None |
| Worker | `npx wrangler rollback` | ~2 min | None — KV untouched |
| **KV namespace** | **No rollback** | — | **Permanent** |

Re-running a previous Actions run is usually faster than reverting a commit and
needs no git operation.

> ⚠️ **Never run `wrangler kv namespace delete` or bulk-delete `lead:` keys.**
> That store is the enquiry history and the Phase-2 CRM's seed data.

### Two rules

1. **Change one thing at a time.** Changing three settings at once means you
   cannot tell which fixed it — or which caused it.
2. **Write down every change as you make it.** An hour into troubleshooting,
   nobody remembers what they toggled.

### Symptom → action

| Symptom | Do this |
|---|---|
| Certificate error | Grey cloud → wait → re-add domain → wait for issuance → Full (strict) → re-proxy |
| Infinite redirect | SSL/TLS is Flexible. Set Full (strict). |
| 404 everywhere | Pages source is a branch, not Actions |
| Pages load unstyled | Rocket Loader or Auto Minify on. Turn off, purge cache. |
| Stale content | Purge the URL |
| Form 403 | `ALLOWED_ORIGIN` mismatch — exact, scheme included, no trailing slash |
| Form "not live yet" | `PUBLIC_FORM_ENDPOINT` unset at build. Set it, re-run workflow. |
| Form ok, no email | **Check KV first.** Lead present → email path broken, no data lost. Absent → Worker not receiving. |

### Full stop

1. Cloudflare → delete the DNS record
2. GitHub → Pages → remove the custom domain
3. Site remains at `bikashkadayat.github.io/Navadisha-/` for your own testing
4. **Leave the Worker deployed** — costs nothing, preserves captured leads
5. **Do not touch KV**

Nothing is lost. Only public reachability is removed.
