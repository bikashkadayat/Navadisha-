# 1 · Production deployment checklist

The master pre-flight. Work top to bottom; each section links to its detailed
document. **Nothing here is optional except where marked.**

---

## Gate A — Decisions (before touching anything)

- [ ] **Domain decided** — subdomain or apex. See [#4](./04-domain-cutover.md).
      Every other step depends on this answer.
- [ ] **Mailbox for `contact@navadisha.com.np` exists and receives mail.**
      Not the same thing as being able to *send* from it. See
      [#6](./06-email-verification.md).
- [ ] **Launch window agreed** — a weekday morning, not a Friday afternoon.
      Someone must be available for four hours afterwards.
- [ ] **Rollback plan read** — [#8](./08-rollback-plan.md). Read it now, not
      during an incident.

---

## Gate B — Accounts and access

- [ ] GitHub account or organisation, with the repository owner identified
- [ ] Cloudflare account, with `navadisha.com.np` (and/or `bikashkadayat.com.np`)
      added as a zone
- [ ] Registrar access — nameservers must point at Cloudflare
- [ ] Transactional email provider account (Resend or equivalent)
- [ ] Everything above accessible by **at least two people**. A launch that only
      one person can undo is a single point of failure.

---

## Gate C — Repository

Detail in [#3](./03-github-repo-init.md).

- [ ] `git init`, first commit, pushed
- [ ] `.gitignore` verified — **no `.env` committed**
- [ ] Pages source set to **GitHub Actions**, not a branch
- [ ] Repository variable `SITE_URL` set — *see the defect note in
      [README](./README.md); skipping this breaks every canonical URL*
- [ ] `PUBLIC_FORM_ENDPOINT` added to the workflow build environment
- [ ] `public/CNAME` created, matching the chosen domain
- [ ] First Actions run green — build **and** validation

---

## Gate D — Worker

Detail in [#2](./02-worker-deployment.md).

- [ ] KV namespace `LEADS` created, id pasted into `wrangler.toml`
- [ ] `RESEND_API_KEY` secret set
- [ ] `TURNSTILE_SECRET` set *(optional — honeypot and rate limiting work without it)*
- [ ] `ALLOWED_ORIGIN` matches the final domain exactly, including scheme
- [ ] Worker deployed
- [ ] All nine verification curls pass

---

## Gate E — DNS and email

Detail in [#5](./05-dns-migration.md) and [#6](./06-email-verification.md).

- [ ] DNS record added, **grey cloud (DNS-only) initially** — this matters, see #4
- [ ] GitHub Pages custom domain added and certificate provisioned
- [ ] *Enforce HTTPS* enabled in GitHub Pages settings
- [ ] Cloudflare proxy switched on, SSL/TLS mode **Full (strict)**
- [ ] SPF, DKIM and DMARC records added for the sending domain
- [ ] Provider reports the domain verified
- [ ] Test email sends **and arrives**, not just "accepted"

---

## Gate F — Verification on the live site

- [ ] Homepage loads over HTTPS with no certificate warning
- [ ] All 24 pages reachable; spot-check ten
- [ ] `/sitemap-index.xml` and `/robots.txt` return 200
- [ ] A deliberately wrong URL returns the 404 page
- [ ] **Contact form submits successfully from the live domain**
- [ ] Notification email arrives at `contact@navadisha.com.np`
- [ ] Acknowledgement email arrives at the sender's address
- [ ] Lead appears in KV
- [ ] WhatsApp and `tel:` links open correctly on a real phone
- [ ] Lighthouse run against the live URL — scores hold
- [ ] Dark mode checked on a device set to dark
- [ ] Real mid-range Android: scroll, mobile menu, form

---

## Gate G — Post-launch, same day

- [ ] Google Search Console verified, sitemap submitted
- [ ] Google Business Profile created *(needs the Baneshwar address)*
- [ ] Name, address and phone identical across site, GBP and any directory
- [ ] Someone monitoring `contact@` for the rest of the day

---

## Known-and-accepted at launch

These ship as they are. They are recorded so nobody rediscovers them as
surprises.

| Item | State | Why it is acceptable |
|---|---|---|
| Favicon illegible at 32px | 3D raster mark | Needs the SVG redraw; not fixable by resampling |
| No analytics | Deliberate | Privacy policy states it. Add Cloudflare Web Analytics after. |
| Team photography | Initials fallback | Designed for; upgrades by populating one field |
| NIF case study has no metric | Stated on the page | One email to the client resolves it |
| Registration pending | Stated on three pages | Blocks public tenders only |
| "Pvt. Ltd." shown pre-incorporation | Client decision | One flag reverts; does not enable fake registration data |
