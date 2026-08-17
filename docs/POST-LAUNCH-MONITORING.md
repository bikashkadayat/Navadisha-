# Post-launch monitoring

What to watch, how often, and what each signal means you should do.

**The premise:** this site has no server, no database and no analytics. Almost
nothing can break loudly. **The failures worth monitoring are the silent ones** —
particularly a broken email path, which looks identical to "nobody enquired".

---

## The one that matters most

> ### A lead in KV with no matching email means sending is broken.
>
> The Worker writes to KV **before** attempting email, so a delivery failure
> never loses an enquiry. But the visitor saw a success message, you saw
> nothing, and the lead sits unread.
>
> **Nobody will report this.** Not the enquirer — they think you ignored them.
> Not you — your inbox looks normal. The KV check is the only signal.

```bash
npx wrangler kv key list --binding LEADS --prefix "lead:"
```

Compare the count against emails received. They must match.

---

## Cadence

| Frequency | Check | Time |
|---|---|---|
| **Daily, week 1** | KV vs inbox · form submission · Search Console | 5 min |
| **Weekly** | KV reconciliation · Cloudflare analytics · uptime | 10 min |
| **Monthly** | Lighthouse · Search Console · `npm audit` · content review | 30 min |
| **Quarterly** | Full audit · dependency updates · security re-review | 2 h |

---

## Daily — first week only

- [ ] **KV count matches emails received**
      ```bash
      npx wrangler kv key list --binding LEADS --prefix "lead:" | wc -l
      ```
- [ ] Submit the form once yourself, end to end
- [ ] `contact@navadisha.com.np` reachable and being read
- [ ] Site loads: `curl -s -o /dev/null -w "%{http_code}\n" https://navadisha.bikashkadayat.com.np`
- [ ] Search Console → no new coverage errors

**Drop to weekly once seven consecutive days are clean.**

---

## Weekly

### Leads

- [ ] KV reconciled against the inbox — **no orphans**
- [ ] Every enquiry answered within one working day *(the site promises this)*
- [ ] Acknowledgements still landing in inbox, not spam

> **Spam placement drifts.** A new sending domain builds reputation slowly, and
> a run of unanswered mail can undo it. Send yourself a test from a different
> provider monthly.

### Availability

```bash
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" https://navadisha.bikashkadayat.com.np
```

- [ ] 200, under 1s
- [ ] Cloudflare Analytics — no 4xx/5xx spike
- [ ] Certificate not approaching expiry

### Content freshness

- [ ] Programme statuses still accurate — **is anything still saying "tentatively October 2026" after October?**
- [ ] Workshop dates current
- [ ] Nothing marked "planned" that has since run

> This is the most likely way the site becomes quietly dishonest. A page that
> said "tentative" truthfully in August is misleading in November. The honesty
> guarantees in this build are structural, but **dates are not** — they need a
> human.

---

## Monthly

### Performance

```bash
npx lighthouse https://navadisha.bikashkadayat.com.np \
  --only-categories=performance,accessibility,best-practices,seo \
  --chrome-flags="--headless=new" --view
```

| Metric | Baseline | Investigate below |
|---|---|---|
| Performance (mobile) | 99–100 | 90 |
| **Accessibility** | **100** | **any drop** |
| Best practices | 100 | 95 |
| SEO | 100 | 95 |
| LCP (mobile) | 1.7–1.8 s | 2.5 s |
| CLS | 0 | 0.1 |

**Any accessibility drop is a regression, not noise.** It was 100 on every page
at launch; there is no natural variance to absorb.

### Search

- [ ] Search Console → Coverage: indexed page count ≈ 23
- [ ] No manual actions
- [ ] Core Web Vitals: all URLs "Good"
- [ ] Queries the site actually appears for — do they match intent?
- [ ] Google Business Profile: NAP still identical to the site

### Security

```bash
npm audit --omit=dev
curl -sI https://navadisha.bikashkadayat.com.np | grep -iE \
  'strict-transport|x-content-type|referrer-policy|x-frame|permissions-policy|content-security'
```

- [ ] No high or critical advisories
- [ ] All six security headers present
- [ ] `securityheaders.com` grade A or better

### Content integrity

- [ ] No fabricated claims have crept in *(CI enforces, but read anyway)*
- [ ] Contact details still correct
- [ ] Registration status still accurate — **has incorporation completed?**

---

## Quarterly

- [ ] Full [DEPLOYMENT-AUDIT](./DEPLOYMENT-AUDIT.md) re-run
- [ ] [SECURITY-REVIEW](./SECURITY-REVIEW.md) re-verified
- [ ] Dependencies updated, `npm run build` re-verified
- [ ] Every page read once, aloud
- [ ] Rollback procedure walked through — **on paper**, so it is not first read during an incident
- [ ] Restore-from-scratch tested: can you rebuild and redeploy from a clean clone?

---

## Alert thresholds

| Signal | Threshold | Severity | Action |
|---|---|---|---|
| Site returns non-200 | Any | 🔴 P1 | [Rollback](./COMMANDS.md#6--rollback) |
| TLS error | Any | 🔴 P1 | [Certificate recovery](./DNS-VERIFICATION.md#certificate-recovery) |
| Lead in KV, no email | Any | 🔴 P1 | [EMAIL-SETUP](./EMAIL-SETUP.md) — enquiries are being missed |
| Form returns 403 | Any | 🔴 P1 | `ALLOWED_ORIGIN` mismatch |
| Enquiry unanswered > 1 working day | Any | 🟠 P2 | The site promises this in writing |
| Accessibility < 100 | Any | 🟠 P2 | Regression — bisect the change |
| Acknowledgements in spam | Any | 🟠 P2 | Check DKIM/DMARC alignment |
| Performance < 90 mobile | Sustained | 🟡 P3 | Check for a newly added asset |
| Indexed pages < 20 | Sustained | 🟡 P3 | Search Console coverage report |
| 4xx spike | > 5 % of traffic | 🟡 P3 | Usually a bad external link |

---

## Optional: uptime monitoring

The site is static on a CDN, so unavailability is rare. If you want a signal
anyway, any free monitor works:

```
URL       https://navadisha.bikashkadayat.com.np
Interval  5 minutes
Expect    200 · body contains "Navadisha"
Alert     email + WhatsApp
```

**More valuable than uptime:** monitor the Worker, because that is the part that
can fail silently while the site looks perfect.

```
URL       https://navadisha.bikashkadayat.com.np/api/contact
Method    POST · body {}
Expect    400          ← validation rejecting an empty body proves it is alive
```

A 5xx or timeout there means the form is down while every page still loads.

---

## Adding analytics

Currently none — deliberate, and the privacy policy says so accurately.

If you add **Cloudflare Web Analytics** (cookieless, so the "no cookies" claim
survives):

- [ ] Enable in the Cloudflare dashboard
- [ ] **Edit `src/pages/privacy/index.astro` in the same commit** — the policy
      names what is in use, and leaving it stale would make it false
- [ ] Rebuild and deploy

The policy already anticipates this:

> *"If we add privacy-respecting analytics later … this page will be updated
> before it goes live, and it will be named here."*

Then watch: which pages get read, where visitors arrive from, and whether the
homepage's dual routing CTA is actually splitting traffic between institutions
and students.

---

## Trigger-based updates

Not calendar items — do these when the condition becomes true. Each is a data
change, not a code change.

| Trigger | Action | Effect |
|---|---|---|
| Registration certificate issued | Fill `registration` in `src/data/company.ts`, flip `REGISTRATION_STATUS` | Compliance block, LocalBusiness schema and the government segment all switch on |
| 3rd featured case study | Add the content file | Homepage and Work switch to a card grid automatically |
| 2 programmes at `running` | Add Programs to `primaryNav` | Promotes it out of the mega menu — see [OPERATIONS](./OPERATIONS.md#promote-programs-into-the-top-navigation) |
| 3 articles written | Build `/insights/` templates, restore nav | Insights section goes live |
| First consented testimonial | Add the content file | Homepage Voices section appears |
| Workshop delivered | Change status, add real outcomes | Three pages stop saying "tentative" |
| NIF confirms a metric | Update `outcomes`, set `metricsPending: false` | The "no quantified result" note disappears |

---

## Monthly review — five questions

Worth ten minutes with someone else in the room.

1. **Did every enquiry get a reply within one working day?** The site promises
   this in writing. If not, either fix the process or change the promise.
2. **Is anything on the site no longer true?** Dates, statuses, availability.
3. **What did people actually ask about?** If enquiries cluster on something the
   site explains badly, that is the highest-value content edit available.
4. **Did anything get added without evidence?** The CI checks catch known
   patterns, not new ones.
5. **What is still marked "planned" that should have happened by now?**

Question 5 is the one that quietly erodes credibility. A workshop still labelled
*tentatively October 2026* in December does more damage than never having listed
it — it says the practice does not follow through.
