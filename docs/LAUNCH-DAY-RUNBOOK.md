# Launch day runbook

**Site:** `https://navadisha.bikashkadayat.com.np`
**Duration:** ~4 hours including waiting
**When:** a **weekday morning**. Not a Friday, not an evening.

If something needs attention you want a full working day ahead of you, and you
want the email provider's support reachable.

**Two people should have access** to GitHub, Cloudflare and the email provider.
A launch only one person can undo is a single point of failure.

---

## Prerequisites — all four must be true

| # | Item | Reference |
|---|---|---|
| 1 | `contact@navadisha.com.np` **receives** mail — tested | [EMAIL-SETUP](./EMAIL-SETUP.md) |
| 2 | Worker deployed, verification gate passed | [WORKER-DEPLOYMENT-CHECKLIST](./WORKER-DEPLOYMENT-CHECKLIST.md) |
| 3 | Sending domain verified — SPF, DKIM, DMARC | [EMAIL-SETUP](./EMAIL-SETUP.md) |
| 4 | `SITE_URL` and `PUBLIC_FORM_ENDPOINT` variables set | [PRODUCTION-DEPLOYMENT](./PRODUCTION-DEPLOYMENT.md) |

**If any is false, stop.** Launching without them produces a site that looks
finished and quietly loses enquiries — the worst possible failure, because
nobody reports it.

---

## T-1 · The evening before

**Do not touch DNS.** Preparation only, all reversible.

| | Step | Gate |
|---|---|---|
| ☐ | `nvm use && npm run build` | `24 page(s) built` · `✔ All checks passed` |
| ☐ | Everything committed and pushed | `git status` clean |
| ☐ | Actions run green | Build + validate |
| ☐ | Site checked at `bikashkadayat.github.io/Navadisha-/` | Loads correctly |
| ☐ | Worker responds | See below |
| ☐ | Email verified with the provider | Dashboard shows Verified |
| ☐ | DNS TTL lowered to 300s | |

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$ENDPOINT" \
  -H 'content-type: application/json' -d '{}'
# → 400 : validation is running, the Worker is alive
```

Sleeping on a green build is worth more than launching an hour earlier.

---

## 09:00 · Pre-flight *(15 min)*

- [ ] `nvm use && npm run build` — clean
- [ ] `git status` clean, nothing unpushed
- [ ] Latest Actions run green
- [ ] Worker returns 400 on an empty body
- [ ] A text file open for writing down every change you make today

---

## 09:15 · Certificate *(5 min + wait)*

> ⚠️ **The proxy is already enabled**, which blocks GitHub's domain validation.
> This step is either instant or the longest part of the day.

- [ ] GitHub → Settings → Pages → **"Certificate issued"**?

**If yes** → continue.
**If no** → run the [certificate recovery sequence](./DNS-VERIFICATION.md#certificate-recovery)
now. Do not proceed until it shows issued.

- [ ] **Enforce HTTPS** enabled
- [ ] Cloudflare → SSL/TLS → **Full (strict)**
- [ ] Record proxied (orange cloud)

---

## 09:45 · Verification procedure *(20 min)*

Full detail: [DNS-VERIFICATION](./DNS-VERIFICATION.md).

```bash
H="navadisha.bikashkadayat.com.np"
dig $H +short
curl -s -o /dev/null -w "https  %{http_code}\n" "https://$H"
curl -s -o /dev/null -w "http   %{http_code} → %{redirect_url}\n" "http://$H"
curl -s -o /dev/null -w "404    %{http_code}\n" "https://$H/nonexistent/"
curl -sI "https://$H" | grep -iE 'server|cf-ray|content-encoding|strict-transport'
echo | openssl s_client -connect $H:443 -servername $H 2>/dev/null | openssl x509 -noout -dates
```

- [ ] Resolves through Cloudflare
- [ ] HTTPS 200, HTTP 301 in **one** hop
- [ ] Bad path returns the styled 404, not a bare GitHub 404
- [ ] `server: cloudflare`, `cf-ray` present
- [ ] `content-encoding: br`
- [ ] Certificate valid, no browser warning
- [ ] Rocket Loader / Auto Minify / Email Obfuscation confirmed **off**

---

## 10:05 · Smoke testing *(30 min)*

### Structure

- [ ] Homepage loads over HTTPS
- [ ] Ten pages spot-checked, at least one per section:
      `/` `/institutions/` `/institutions/colleges/` `/students/`
      `/students/workshops/` `/programs/ai-for-students/` `/services/`
      `/about/method/` `/work/nepal-internet-foundation-website/` `/contact/`
- [ ] `/sitemap-index.xml` → 200, 23 URLs, correct host
- [ ] `/robots.txt` → 200, sitemap line correct
- [ ] `/sitemap/` (the HTML one) renders
- [ ] View source on any page: canonical shows the live host
- [ ] Navigation works — mega menu opens, all five items resolve
- [ ] Footer links resolve

### The form — the most important test of the day

- [ ] Submit from the **live site** with a real address
- [ ] Success message appears, stating what happens next
- [ ] **Notification** arrives at `contact@navadisha.com.np`
- [ ] **Acknowledgement** arrives at the sender — **check spam**
- [ ] Lead in KV: `npx wrangler kv key list --binding LEADS --prefix "lead:"`
- [ ] Empty submission → inline errors, focus moves to the first invalid field
- [ ] Errors carry the ⚠ symbol, not colour alone

> **A lead in KV with no email means the email path is broken.** No data is
> lost — the Worker persists before sending — but the sender received no
> confirmation and will assume you never replied.

### Real phone — mid-range Android

- [ ] Mobile menu opens, body scroll locks, close returns focus
- [ ] Services accordion expands
- [ ] Sticky CTA reachable without scrolling back up
- [ ] WhatsApp link opens with the message pre-filled
- [ ] `tel:` link opens the dialler
- [ ] No zoom when focusing a form field
- [ ] Glass header scrolls without jank
- [ ] Dark mode: switch the device, re-check homepage and contact

### Measured

- [ ] Lighthouse mobile against the live URL
- [ ] Performance ≥ 99 · **Accessibility 100** · Best practices 100 · SEO 100
- [ ] The text-compression deduction is **gone** — Brotli is doing its job

---

## 10:35 · Search and discovery *(20 min)*

- [ ] Google Search Console → add property → verify by DNS TXT
- [ ] Submit `https://navadisha.bikashkadayat.com.np/sitemap-index.xml`
- [ ] Request indexing for the homepage
- [ ] Google Business Profile → create → Baneshwar address, hours, phone
- [ ] Name, address and phone **identical** to the site, character for character

> NAP inconsistency is the most common and most avoidable local-SEO error. Copy
> and paste; do not retype.

---

## 10:55 · Announce

**Only now.** Not before the form has delivered a real email to a real inbox.

- [ ] Social profiles updated with the URL
- [ ] Email signatures updated
- [ ] Nepal Internet Foundation told — they are named on the site and may share it

---

## 11:00 – 17:00 · Watch

| Interval | Check |
|---|---|
| Hourly | `contact@` inbox |
| Hourly | `npx wrangler kv key list --binding LEADS --prefix "lead:"` |
| Midday | Cloudflare Analytics — traffic arriving, no 5xx spike |
| Mid-afternoon | Search Console — crawl errors |
| End of day | One more form submission end to end |

---

## End-of-day sign-off

- [ ] All 24 pages reachable
- [ ] Form working, both emails arriving
- [ ] No 5xx in Cloudflare Analytics
- [ ] No critical Search Console errors
- [ ] Someone owns the inbox tomorrow
- [ ] Today's change log saved somewhere findable

---

## Emergency rollback

**Two rules, before anything else:**

1. **Change one thing at a time.** Three simultaneous changes means you cannot
   tell which fixed it — or which caused it.
2. **Write down every change as you make it.**

### Severity 1 — site down or wrong content

```bash
# fastest: no git operation needed
# GitHub → Actions → last known-good run → "Re-run all jobs"     (~2 min)

# or revert
git revert HEAD && git push origin main                          (~3 min)
```

### Severity 1 — certificate or TLS failure

```
Cloudflare → set record to DNS-only (grey cloud)
```

The site drops to HTTP-only through GitHub while you work. Then follow
[certificate recovery](./DNS-VERIFICATION.md#certificate-recovery).

### Severity 2 — form broken

**Check KV first — it tells you which half failed.**

| KV | Meaning | Urgency |
|---|---|---|
| Lead present | Form and Worker fine; **email path broken** | Low — no data lost |
| Lead absent | Worker not receiving | High — enquiries lost |

```bash
npx wrangler tail                    # live logs
npx wrangler rollback                # previous Worker version
```

### Severity 3 — styling or interactions broken

Almost always a Cloudflare optimisation.

1. Rocket Loader → **off**
2. Auto Minify → **off**
3. Purge cache
4. Hard reload

### Full stop

1. Cloudflare → delete the DNS record *(TTL 300s)*
2. GitHub → Pages → remove the custom domain
3. Site stays at `bikashkadayat.github.io/Navadisha-/` for your own testing
4. **Leave the Worker deployed** — costs nothing, preserves captured leads
5. **Do not touch KV**

Nothing is lost. Only public reachability is removed.

> ⚠️ **Never run `wrangler kv namespace delete` or bulk-delete `lead:` keys.**
> That store is the enquiry history and the Phase-2 CRM's seed data. Every other
> layer is reversible. This one is not.

---

## After any incident

- [ ] Write down symptom, cause and fix — in that order
- [ ] Add it to this runbook if it could recur
- [ ] If a check would have caught it, add the check to `scripts/validate.mjs`

The validation suite exists because three defects shipped before it did. A check
that fails the build is worth more than a note somebody has to remember.
