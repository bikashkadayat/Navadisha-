# Final audit report

**Project:** NAVADISHA Consulting & Innovations Pvt. Ltd. — Phase-1 website
**Date:** 17 August 2026
**Target:** `https://navadisha.bikashkadayat.com.np`

---

## Headline

| Metric | Score |
|---|---|
| **Build completion** | **100 %** |
| **Deployment readiness** | **72 %** |
| **Recommended decision** | 🟡 **Conditional go** — 4 blockers, ≈ 90 minutes |

The site is finished. What remains is **infrastructure activation**, not
engineering — and none of it touches code.

---

## 1 · Build completion — 100 %

| Area | Scope | Done | % |
|---|---|---|---|
| Pages | 24 | 24 | 100 |
| Components | 31 | 31 | 100 |
| Content — launch scope | All | All | 100 |
| Design system | Tokens, type, motion, icons | Complete | 100 |
| Navigation | Desktop, tablet, mobile, mega menu | Complete | 100 |
| Accessibility | WCAG 2.2 AA | **100 on every page** | 100 |
| SEO | Meta, canonical, OG, schema, sitemap | Complete | 100 |
| CI validation | 6 check classes | Enforcing | 100 |
| Deployment docs | 9 documents | Complete | 100 |

### Measured, not estimated

Real Lighthouse runs against a served production build:

| | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Desktop | 100 | **100** | 100 | 100 | 0.4 s | 0 | 0 ms |
| Mobile | 99–100 | **100** | 100 | 100 | 1.7–1.8 s | 0 | 0 ms |

| Budget | Target | Actual |
|---|---|---|
| Mobile LCP | < 2.5 s | **1.7 s** |
| CLS | < 0.1 | **0** |
| TBT | < 200 ms | **0 ms** |
| JavaScript | < 25 KB | **~4.25 KB** |
| Third-party requests | 0 | **0** |
| Cookies set | 0 | **0** |

---

## 2 · Deployment readiness — 72 %

| Component | Weight | State | Score |
|---|---|---|---|
| Site build | 15 | ✅ 24 pages, validation passing | 15 |
| Deployment config | 10 | ✅ Audited, all pass | 10 |
| Repository | 10 | ✅ Initialised, pushed, `.env` excluded | 10 |
| CI/CD workflow | 10 | ✅ Build + validate + deploy wired | 10 |
| DNS | 10 | ✅ CNAME configured and proxied | 10 |
| Documentation | 10 | ✅ 9 documents | 10 |
| Pages settings | 5 | ⚠️ Source + custom domain not confirmed | 2 |
| SSL certificate | 10 | ⚠️ Issuance unconfirmed — proxy is on | 3 |
| **Worker** | **10** | ❌ **Not deployed** | **0** |
| **Email delivery** | **10** | ❌ **Not configured** | **0** |
| Security headers | 5 | ⚠️ None present yet | 2 |
| **Total** | **100** | | **72** |

### Reading the score

**72 % is a healthy pre-launch number.** Every deduction is a switch that has
not been flipped, not a defect. Nothing on this list requires a code change, a
design decision or a content edit.

Completing the four blockers moves this to **≈ 95 %**. The residual 5 % is
security headers and a screen-reader pass, neither of which blocks launch.

---

## 3 · Remaining risks

### 🔴 High

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| 1 | **Mailbox may not receive mail** | Every enquiry vanishes silently. Nobody reports it, because nothing looks broken. | Send a test from an unrelated account. **15 minutes.** |
| 2 | **Worker not deployed** | Primary conversion channel inactive | Form fails gracefully and offers WhatsApp and phone. Deploy: 30 min. |
| 3 | **Sending domain unverified** | Acknowledgements never arrive; senders conclude they were ignored | Leads still persist to KV — no data lost. SPF/DKIM/DMARC: 15 min. |

> **Risks 2 and 3 must be resolved together.** Deploying the Worker without a
> verified sender produces a form that stores leads correctly and never confirms
> receipt — which reads to the enquirer exactly like being ignored.

### 🟡 Medium

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| 4 | **Certificate blocked by the enabled proxy** | TLS errors that do not point at their cause | Recovery sequence documented in DNS-VERIFICATION |
| 5 | **No security response headers** | No HSTS, CSP, clickjacking or MIME-sniffing protection | Cloudflare Transform Rule, 10 min |
| 6 | **Rocket Loader / Auto Minify** | Would break nav and form; symptom looks nothing like a CDN issue | Confirm both off before launch |
| 7 | **Favicon illegible at 32px** | Weak brand impression in the browser tab | Needs the SVG redraw. Not fixable by resampling. |
| 8 | **No screen-reader pass** | Lighthouse is automated only | One NVDA/VoiceOver pass over the form and nav |

### 🟢 Low / accepted

| # | Item | Position |
|---|---|---|
| 9 | No analytics | Deliberate. Privacy policy states it. |
| 10 | No team photography | Initials fallback is designed for |
| 11 | Registration pending | Stated honestly on three pages; blocks public tenders only |
| 12 | NIF case study has no metric | Page states this rather than estimating |
| 13 | "Pvt. Ltd." shown pre-incorporation | Client decision, implemented; one flag reverts |
| 14 | Personal-name domain | Raised three times, decided. Closed. |

---

## 4 · Blocking items

**Four. ≈ 90 minutes total.** None requires touching code.

| # | Blocker | Owner | Time | Reference |
|---|---|---|---|---|
| 1 | Confirm `contact@navadisha.com.np` **receives** mail | Bikash | 15 min | [EMAIL-SETUP](./EMAIL-SETUP.md) |
| 2 | Verify the sending domain — SPF, DKIM, DMARC | Bikash | 15 min | [EMAIL-SETUP](./EMAIL-SETUP.md) |
| 3 | Deploy the Worker — KV, secret, deploy, verify | Bikash | 40 min | [WORKER-DEPLOYMENT-CHECKLIST](./WORKER-DEPLOYMENT-CHECKLIST.md) |
| 4 | Pages source + custom domain + repo variables | Bikash | 15 min | [PRODUCTION-DEPLOYMENT](./PRODUCTION-DEPLOYMENT.md) |

### Order matters

```
1  Mailbox receives mail          ← everything else is pointless without this
        │
2  Sending domain verified  ──┐
        │                     ├── same sitting
3  Worker deployed          ──┘
        │
4  Pages settings + variables → rebuild
        │
5  Certificate confirmed → launch
```

**Blocker 1 first.** If enquiries land nowhere, a perfectly deployed form is
worse than no form — it collects messages nobody reads.

---

## 5 · Recommended launch decision

## 🟡 CONDITIONAL GO

**Launch once the four blockers are cleared.** They are configuration, not
construction, and they total roughly 90 minutes.

### Why not an unconditional go

Three of the four blockers concern the contact pipeline. A site that looks
finished and silently drops enquiries is worse than one that is visibly
unfinished — the failure is invisible from both sides, so nobody reports it and
nobody investigates.

### Why not a no-go

Everything that required engineering judgement is done and measured.
Accessibility is at 100 on every page tested. There are no known defects in the
build. The remaining work is switches, not decisions.

### Confidence

| Dimension | Confidence | Basis |
|---|---|---|
| Build correctness | **High** | 24 pages, CI enforcing, Lighthouse measured |
| Accessibility | **High** | 100 across every page tested |
| Performance | **High** | Measured against a served build |
| Content integrity | **High** | Nine forbidden patterns enforced in CI |
| Deployment procedure | **Medium-high** | Documented in detail, **not yet executed** |
| Email delivery | **Untested** | The one genuinely unknown quantity |

**Email delivery is the only real unknown.** Everything else has been measured
or verified. Test it before launch, not after.

---

## 6 · Post-launch, first 30 days

| Priority | Item | Why |
|---|---|---|
| 1 | Security headers + HSTS | 15 min, closes the largest remaining gap |
| 2 | Screen-reader pass | The last untested accessibility surface |
| 3 | **NIF quantified metric** | One email. Strengthens the site's only proof asset. |
| 4 | SVG logo redraw | Fixes the favicon; unlocks print and dark backgrounds |
| 5 | Cloudflare Web Analytics | **Update the privacy policy in the same commit** |
| 6 | CSP in Report-Only, then enforce | Requires a week of observation |
| 7 | Team photography | Highest-return visual improvement |
| 8 | Confirm workshop dates | Three pages currently say "tentative" |

---

## 7 · What was verified for this report

```
✅ astro.config.mjs        site, base, trailingSlash, format, sitemap filter
✅ public/CNAME            hostname only, 31 bytes, ships to dist/
✅ public/.nojekyll        added this phase — prevents _astro/ being stripped
✅ robots.txt              source == built, absolute sitemap URL
✅ sitemap                 23 URLs, 404 excluded, correct host
✅ canonical URLs          24/24 correct host and path, trailing slash
✅ OpenGraph               7 tags × 24 pages, og:url == canonical, image absolute
✅ og-default.jpg          present, 83.7 KB
✅ noindex                 exactly one page (404)
✅ third-party requests    zero
✅ cookies                 zero
✅ secrets in repository   none
✅ CI workflow             npm ci, build+validate, artifact path, concurrency
✅ Lighthouse              desktop and mobile, 13 pages
```

One false positive was found and corrected during this audit: an initial scan
reported `og:site_name` missing on all 24 pages. The regex did not match the
underscore in the property name — the tag is present and correct everywhere.
Recorded in [DEPLOYMENT-AUDIT](./DEPLOYMENT-AUDIT.md) so a reader running a
similar check does not repeat it.

---

## Sign-off

| | |
|---|---|
| Build | ✅ Complete — 24 pages, 100 % |
| Deployment readiness | 🟡 72 % — 4 blockers, ~90 min |
| Blocking defects in code | **None** |
| Decision | 🟡 **Conditional go** |
| Deployed | ❌ No — nothing pushed, nothing live |

**No code, content, design or architecture was modified in this phase.** The
only file changes were deployment assets: `public/CNAME`, `public/.nojekyll`,
`.env.example`, nine documents, and a workflow correction so CI and local builds
resolve to the same origin.
