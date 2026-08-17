# 7 · Launch day runbook

A timed sequence for the day itself. Roughly **four hours** including waiting.

**Schedule a weekday morning.** Not a Friday, not an evening. If something needs
attention you want a full working day ahead of you, and you want the email
provider's support reachable.

---

## Before the day

- [ ] [Production checklist](./01-production-checklist.md) Gates A–D complete
- [ ] Domain decided — [#4](./04-domain-cutover.md)
- [ ] `contact@navadisha.com.np` **receives** mail, verified by test
- [ ] [Rollback plan](./08-rollback-plan.md) read
- [ ] Two people have access to GitHub, Cloudflare and the email provider

---

## T-minus — the evening before

**Do not touch DNS.** This is preparation only, all of it reversible.

| | Step |
|---|---|
| ☐ | `npm run build` locally — 24 pages, validation passes |
| ☐ | Repository pushed, Actions run green |
| ☐ | Site verified at `<owner>.github.io/<repo>/` |
| ☐ | Worker deployed, all nine curls pass |
| ☐ | Email domain verified with the provider |
| ☐ | DNS TTL lowered to **300s** |

Sleeping on a green build is worth more than launching an hour earlier.

---

## 09:00 — Final pre-flight *(15 min)*

```bash
cd /home/dell/Desktop/NAVADISHA
nvm use && npm run build
```

- [ ] 24 pages, **"All checks passed"**
- [ ] `git status` clean, everything pushed
- [ ] Actions run green
- [ ] Worker responds:
      `curl -s -o /dev/null -w "%{http_code}\n" -X POST "$ENDPOINT" -H 'content-type: application/json' -d '{}'`
      → expect **400** (validation rejecting an empty body proves it is alive)

---

## 09:15 — DNS, grey cloud *(10 min + wait)*

- [ ] Add the DNS record, **proxy OFF**
- [ ] `dig navadisha.com.np +short` returns GitHub
- [ ] Do **not** enable the proxy yet

---

## 09:30 — GitHub Pages custom domain *(5 min + wait)*

- [ ] Settings → Pages → Custom domain → hostname → Save
- [ ] "DNS check successful"
- [ ] **Wait for "Certificate issued"** — usually minutes, occasionally an hour

> This is the step that cannot be rushed. Enabling the Cloudflare proxy before
> the certificate exists is the single most common way this goes wrong, and the
> resulting errors do not obviously point at the cause.

---

## 10:00 — HTTPS and proxy *(10 min)*

- [ ] GitHub: **Enforce HTTPS** on
- [ ] Cloudflare: SSL/TLS → **Full (strict)** — set this *before* the proxy
- [ ] Cloudflare: switch record to **orange cloud**
- [ ] Confirm: Brotli **on**, Rocket Loader **off**, Auto Minify **off**
- [ ] `curl -I https://navadisha.com.np` → 200, valid certificate

---

## 10:15 — Live verification *(30 min)*

**Structure**

- [ ] Homepage loads, no certificate warning
- [ ] Ten pages spot-checked across every section
- [ ] `/sitemap-index.xml` and `/robots.txt` return 200
- [ ] A bad URL returns the 404 page
- [ ] Canonical tags in page source show the live host
- [ ] `www` redirects to the canonical host

**The form — the most important test of the day**

- [ ] Submit from the live site with a real address
- [ ] Success message appears
- [ ] Notification arrives at `contact@navadisha.com.np`
- [ ] Acknowledgement arrives at the sender — **check spam**
- [ ] Lead in KV: `npx wrangler kv key list --binding LEADS --prefix "lead:"`
- [ ] Submit with an empty form → inline errors, focus moves to the first
- [ ] Submit twice more → rate limiting still permits (limit is 5/hour)

**On a real phone**

- [ ] Mobile menu opens, scroll locks, close returns focus
- [ ] WhatsApp link opens with the message pre-filled
- [ ] `tel:` link opens the dialler
- [ ] Form usable one-handed; no zoom on field focus
- [ ] Dark mode: switch the device and re-check the homepage and contact page

**Measured**

- [ ] Lighthouse against the live URL, mobile
- [ ] Performance ≥ 99, accessibility 100 — **the Brotli deduction should now be gone**

---

## 10:45 — Search and discovery *(20 min)*

- [ ] Google Search Console → add property → verify by DNS TXT
- [ ] Submit `https://navadisha.com.np/sitemap-index.xml`
- [ ] Request indexing for the homepage
- [ ] Google Business Profile → create → Baneshwar address, hours, phone
- [ ] Name, address and phone **identical** to the site, character for character

---

## 11:05 — Announce

Only now. Not before the form has been proven to work end to end.

- [ ] Social profiles updated with the URL
- [ ] Email signatures updated
- [ ] Tell Nepal Internet Foundation — they are on the site and may share it

---

## 11:15 – 17:00 — Watch

| Interval | Check |
|---|---|
| Hourly | `contact@` inbox |
| Hourly | `wrangler kv key list --binding LEADS --prefix "lead:"` — a lead in KV with no email means the email path is broken |
| Midday | Cloudflare Analytics — traffic arriving, no 5xx spike |
| End of day | Search Console for crawl errors |

- [ ] Submit one more form at end of day — confirms nothing degraded

---

## End of day

- [ ] All 24 pages reachable
- [ ] Form working, both emails arriving
- [ ] No 5xx in Cloudflare Analytics
- [ ] Search Console shows no critical errors
- [ ] Someone owns the inbox tomorrow

---

## If something breaks

Do not improvise. Go to [#8](./08-rollback-plan.md), find the symptom, follow
the procedure. Most failures on launch day are configuration, not code, and are
reversible in minutes — but only if you change one thing at a time.

**Write down what you changed, as you change it.** An hour into troubleshooting,
nobody remembers which three settings they toggled.
