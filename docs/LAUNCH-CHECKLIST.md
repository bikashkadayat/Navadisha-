# Launch checklist

**Domain:** `navadisha.bikashkadayat.com.np` — confirmed
**DNS:** CNAME `navadisha` → `bikashkadayat.github.io`, proxied — already configured

Print this. Tick as you go.

---

## Pre-launch

### Blockers — the site should not go live without these

- [ ] **`contact@navadisha.com.np` receives mail.** Send it a test from an
      unrelated account and confirm arrival. *Sending and receiving are
      different services — the transactional provider can send **as** this
      address but cannot deliver **to** it.* The address is on nine pages and is
      the destination for every form submission.
- [ ] **Cloudflare Worker deployed** — [`worker/DEPLOYMENT.md`](../worker/DEPLOYMENT.md)
- [ ] **Sending domain verified** — SPF, DKIM, DMARC. Do this in the same
      sitting as the Worker; doing one without the other gives you a form that
      stores leads correctly but never confirms receipt.
- [ ] **`SITE_URL` repository variable set** to `https://navadisha.bikashkadayat.com.np`
- [ ] **`PUBLIC_FORM_ENDPOINT` repository variable set**, then rebuild — the
      endpoint is compiled in at build time

### Repository

Already done: initialised on `main`, pushed to
[`bikashkadayat/Navadisha-`](https://github.com/bikashkadayat/Navadisha-),
111 files tracked, `.env` and `node_modules` correctly excluded.

- [x] ~~`git init`, first commit, pushed to GitHub~~
- [x] ~~`.gitignore` verified — no `.env` committed~~
- [ ] Commit and push this deployment-assets change set
- [ ] Settings → Pages → Source: **GitHub Actions** (not a branch)
- [ ] `public/CNAME` contains `navadisha.bikashkadayat.com.np` — hostname only
- [ ] First Actions run green: `24 page(s) built` + `✔ All checks passed`
- [ ] Verified at `bikashkadayat.github.io/<repo>/` **before touching DNS** —
      cheapest possible smoke test, and it separates build problems from domain
      problems

### Cloudflare

- [ ] SSL/TLS mode: **Full (strict)** — never Flexible
- [ ] Always Use HTTPS: on
- [ ] Brotli: **on** *(without it Lighthouse deducts for text compression)*
- [ ] Rocket Loader: **off** *(will break the nav and form)*
- [ ] Auto Minify: **off**
- [ ] Email Obfuscation: **off**
- [ ] Security headers Transform Rule — [SECURITY-REVIEW](./SECURITY-REVIEW.md)
- [ ] HSTS at `max-age=86400` to start

### Certificate

> ⚠️ **The proxy is already enabled.** GitHub cannot complete domain validation
> through a proxy. If its certificate has not been issued, follow the recovery
> sequence in [DEPLOYMENT](./DEPLOYMENT.md#-if-the-certificate-is-failing) —
> grey cloud, wait, add the custom domain, wait for issuance, then re-proxy.

- [ ] GitHub → Settings → Pages → custom domain shows **"Certificate issued"**
- [ ] **Enforce HTTPS** enabled
- [ ] `curl -I https://navadisha.bikashkadayat.com.np` → 200, valid certificate

### Worker verification

- [ ] Valid submission returns `{"ok":true}` and a lead appears in KV
- [ ] Honeypot submission returns ok and stores **nothing**
- [ ] Sixth submission from one IP within an hour returns **429**
- [ ] Request from another origin returns **403**
- [ ] Malformed JSON returns 400 with a readable message
- [ ] Notification email arrives
- [ ] Acknowledgement email arrives — **check spam**

### Content and QA

- [ ] Every page read once, aloud
- [ ] Phone, email and address correct everywhere
- [ ] No fabricated claims — enforced by CI, but read anyway
- [ ] Real mid-range Android: scroll, mobile menu, form
- [ ] Dark mode checked on a device set to dark
- [ ] Screen-reader pass over the form and navigation

---

## Launch day

Schedule a **weekday morning**. Not a Friday. Roughly four hours including
waiting.

### Evening before — no DNS changes

- [ ] `npm run build` locally — 24 pages, validation passes
- [ ] Everything pushed, Actions green
- [ ] Worker deployed, all checks pass
- [ ] Email verified

### 09:00 — Pre-flight *(15 min)*

- [ ] `nvm use && npm run build` — clean
- [ ] `git status` clean
- [ ] Worker alive:
      `curl -s -o /dev/null -w "%{http_code}\n" -X POST "$ENDPOINT" -H 'content-type: application/json' -d '{}'`
      → **400** proves validation is running

### 09:15 — DNS and certificate

- [ ] Certificate confirmed issued *(or recovery sequence run)*
- [ ] Enforce HTTPS on
- [ ] SSL/TLS Full (strict)
- [ ] Proxy on
- [ ] `dig navadisha.bikashkadayat.com.np +short` returns Cloudflare

### 10:00 — Live verification *(30 min)*

**Structure**

- [ ] Homepage loads over HTTPS, no warning
- [ ] Ten pages spot-checked across every section
- [ ] `/sitemap-index.xml` and `/robots.txt` return 200
- [ ] A bad URL returns the 404 page
- [ ] Canonical tags show the live host

**The form — the most important test of the day**

- [ ] Submit from the live site with a real address
- [ ] Success message appears
- [ ] Notification arrives at `contact@navadisha.com.np`
- [ ] Acknowledgement arrives — **check spam**
- [ ] Lead in KV
- [ ] Empty submission → inline errors, focus moves to the first invalid field

**On a real phone**

- [ ] Mobile menu opens, scroll locks, close returns focus
- [ ] WhatsApp link opens with the message pre-filled
- [ ] `tel:` link opens the dialler
- [ ] No zoom on field focus
- [ ] Dark mode

**Measured**

- [ ] Lighthouse against the live URL, mobile
- [ ] Performance ≥ 99, accessibility 100 — the Brotli deduction should be gone

### 10:45 — Search and discovery

- [ ] Google Search Console → verify by DNS TXT
- [ ] Submit `https://navadisha.bikashkadayat.com.np/sitemap-index.xml`
- [ ] Request indexing for the homepage
- [ ] Google Business Profile → Baneshwar address, hours, phone
- [ ] Name, address and phone identical to the site, character for character

### 11:05 — Announce

**Only now.** Not before the form has delivered a real email.

- [ ] Social profiles updated
- [ ] Email signatures updated
- [ ] Nepal Internet Foundation told — they are on the site and may share it

### Through the day

- [ ] Hourly: `contact@` inbox
- [ ] Hourly: `npx wrangler kv key list --binding LEADS --prefix "lead:"` —
      a lead with no matching email means the email path is broken
- [ ] Midday: Cloudflare Analytics — traffic arriving, no 5xx spike
- [ ] End of day: one more form submission

---

## Post-launch

### First week

- [ ] Search Console — indexing progress, no crawl errors
- [ ] Check KV daily
- [ ] Confirm acknowledgement emails are not landing in spam
- [ ] Raise HSTS from `max-age=86400` to `31536000`
- [ ] Add CSP in `Report-Only`, watch for violations
- [ ] Raise DNS TTL from 300s to 3600s
- [ ] Verify at `securityheaders.com` — grade A or better

### First month

- [ ] **Get the NIF metric.** Best ask: how many content updates their team has
      published unaided — it evidences the Enable stage, which is the
      differentiator. The case study currently states the gap honestly.
- [ ] **Commission the SVG logo** — [`brand/LOGO-SPEC.md`](../brand/LOGO-SPEC.md).
      Fixes the favicon, which is illegible at 32px.
- [ ] Team photography — populate `photo` and the initials fallback upgrades
- [ ] Add Cloudflare Web Analytics, **and update the privacy policy in the same
      commit**
- [ ] Enforce CSP once Report-Only is clean
- [ ] Enable Dependabot

### Trigger-based — no code change required

| Trigger | Action |
|---|---|
| Registration certificate issued | Fill `registration` in `src/data/company.ts`, flip `REGISTRATION_STATUS`. Compliance block, LocalBusiness schema and the government segment all switch on together. |
| 3 featured case studies | Homepage and Work switch to a card grid automatically |
| 2 programmes at `running` | Promote Programs to top nav — [OPERATIONS](./OPERATIONS.md#promote-programs-into-the-top-navigation) |
| 3 articles published | Restore Insights to nav and footer |
| First consented testimonial | Homepage Voices section appears |
| Workshop dates confirmed | Update the cohort; three pages stop saying "tentative" |

---

## Rollback checklist

**Read this before launching, not during an incident.**

### Two rules

1. **Change one thing at a time.** Changing three settings at once means you
   cannot tell which fixed it — or which caused it.
2. **Write down every change as you make it.** An hour into troubleshooting,
   nobody remembers what they toggled.

### By layer

| Layer | Action | Time | Data loss |
|---|---|---|---|
| Bad content | `git revert HEAD && git push` | ~3 min | None |
| Bad deploy | Actions → last good run → **Re-run all jobs** | ~2 min | None |
| DNS | Revert the record | TTL | None |
| Cloudflare setting | Toggle back | Seconds | None |
| Worker | `npx wrangler rollback` | ~2 min | None — KV untouched |
| **KV namespace** | **No rollback** | — | **Permanent** |

> ⚠️ **Never run `wrangler kv namespace delete` or bulk-delete `lead:` keys.**
> That store is the enquiry history and the Phase-2 CRM's seed data.

### Symptom → action

| Symptom | Do this |
|---|---|
| Certificate error | Grey cloud → wait → re-add custom domain → wait for issuance → Full (strict) → re-proxy |
| Infinite redirect | SSL/TLS is Flexible. Set Full (strict). |
| 404 everywhere | Pages source is a branch, not Actions |
| Unstyled / dead menu | Rocket Loader or Auto Minify is on. Turn off, purge cache. |
| Stale content | Purge the URL at Cloudflare |
| Form 403 | `ALLOWED_ORIGIN` mismatch — exact, scheme included, no trailing slash |
| Form "not live yet" | `PUBLIC_FORM_ENDPOINT` unset at build. Set it, re-run workflow. |
| Form ok, no email | **Check KV first.** Lead present → email path broken, no data lost. Lead absent → Worker not receiving. |

### Full stop

1. Cloudflare → delete the DNS record
2. GitHub → Pages → remove the custom domain
3. Site remains at `bikashkadayat.github.io/<repo>/` for your own testing
4. **Leave the Worker deployed** — costs nothing, preserves captured leads
5. **Do not touch KV**

Nothing is lost. Only public reachability is removed.

### After any incident

- [ ] Write down symptom, cause and fix, in that order
- [ ] Add it to this document if it could recur
- [ ] If a check would have caught it, add the check to `scripts/validate.mjs`

The validation suite exists because three defects shipped before it did. A check
that fails the build is worth more than a note somebody has to remember.
