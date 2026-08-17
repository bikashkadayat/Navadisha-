# Email setup

**Address:** `contact@navadisha.com.np`
**Used for:** contact form notifications *and* the acknowledgement sent to every
enquirer
**Status:** ⚠️ **Not configured**

---

## The distinction that decides everything here

**Sending and receiving are different services.** This is the single most
common misunderstanding at this stage of a launch.

| | Service | Provides |
|---|---|---|
| **Sending** | Resend, Postmark, SES | The two emails the Worker generates |
| **Receiving** | Google Workspace, Zoho Mail, registrar hosting | A mailbox a human can read |

Resend can send **as** `contact@navadisha.com.np`. It **cannot deliver to it**.

> ### ⚠️ Verify this before anything else
>
> **Does `contact@navadisha.com.np` currently receive mail?**
>
> Send it a message from an unrelated account — a personal Gmail is fine — and
> confirm it arrives.
>
> That address appears on **nine pages** and is the destination for every form
> submission. If nobody can read it, enquiries vanish into nothing and the
> practice looks unresponsive rather than broken — which is worse, because
> nobody reports it.
>
> Zoho Mail has a free tier for a single custom domain and is usually the
> fastest route if no mailbox exists yet.

---

## Part 1 — Receiving

- [ ] Mailbox provider chosen
- [ ] MX records added for `navadisha.com.np` (the provider supplies exact values)
- [ ] MX records set to **DNS-only / grey cloud** — Cloudflare cannot proxy mail
- [ ] Test message from an outside address **arrives**
- [ ] Reply from that mailbox reaches the outside address
- [ ] Someone checks it daily — the site promises a reply within one working day

### Typical MX shape

```
navadisha.com.np    MX  10   mx.provider.example      (DNS-only)
navadisha.com.np    MX  20   mx2.provider.example     (DNS-only)
```

Priorities and hostnames come from your provider. **Do not proxy MX records** —
Cloudflare's proxy handles HTTP only, and proxying mail records breaks delivery
silently.

---

## Part 2 — Sending

### 2.1 · Provider account

```bash
cd worker
npx wrangler secret put RESEND_API_KEY
```

Confirm in `worker/wrangler.toml`:

```toml
NOTIFY_TO   = "contact@navadisha.com.np"
NOTIFY_FROM = "contact@navadisha.com.np"
```

✅ `NOTIFY_FROM` is already a **domain address**, not a gmail one. A gmail
sender would be rejected outright by any transactional provider.

⚠️ The domain still needs **verifying** with the provider before sending works.

### 2.2 · SPF

Declares which servers may send as your domain.

```
navadisha.com.np   TXT   "v=spf1 include:PROVIDER_INCLUDE ~all"
```

> **⚠️ Exactly one SPF record per domain.** Two SPF records is a **hard
> failure**, not a warning — receivers treat it as a permanent error and your
> mail fails authentication entirely.
>
> If a mailbox provider has already added one, **merge the includes** into a
> single record rather than adding a second:
>
> ```
> "v=spf1 include:mailbox-provider.example include:sending-provider.example ~all"
> ```

`~all` (softfail) is the right starting posture. `-all` (hardfail) is stricter
but unforgiving of a misconfiguration you have not found yet.

### 2.3 · DKIM

A cryptographic signature proving the mail is genuinely yours. The provider
gives you either a long TXT record or a CNAME.

```
selector._domainkey.navadisha.com.np   TXT   "v=DKIM1; k=rsa; p=MIGfMA0..."
```

Paste carefully — the key is long, and a truncated value fails silently.

### 2.4 · DMARC

Tells receivers what to do when SPF or DKIM fail, and where to send reports.

```
_dmarc.navadisha.com.np   TXT   "v=DMARC1; p=none; rua=mailto:contact@navadisha.com.np"
```

> **Start at `p=none`.** It monitors without rejecting. Tighten to `quarantine`
> after a few weeks of clean reports, and only then consider `reject`.
>
> Starting at `p=reject` risks blackholing your own mail before you know whether
> alignment is actually correct — and you will not find out from bounces,
> because rejected mail often disappears without one.

### 2.5 · Checklist

- [ ] SPF added — **exactly one** SPF record on the domain
- [ ] DKIM added, value complete and untruncated
- [ ] DMARC added at `p=none`
- [ ] All three **DNS-only / grey cloud**
- [ ] Provider dashboard reports the domain **Verified**
- [ ] `RESEND_API_KEY` set as a Worker secret, never committed

---

## Part 3 — End-to-end test

Run **after** the Worker is deployed. Use a real address you can check, ideally
on a different provider than the mailbox.

```bash
export ENDPOINT="https://navadisha.bikashkadayat.com.np/api/contact"

curl -X POST "$ENDPOINT" \
  -H 'content-type: application/json' \
  -H "origin: https://navadisha.bikashkadayat.com.np" \
  -d '{"name":"Deployment Test","email":"you@example.com","audience":"other","message":"End-to-end email test"}'
```

- [ ] Response `{"ok":true}`
- [ ] **Notification** arrives at `contact@navadisha.com.np`
- [ ] **Acknowledgement** arrives at the test address
- [ ] Acknowledgement lands in **inbox, not spam**
- [ ] Sender shows as `contact@navadisha.com.np`
- [ ] Replying to the acknowledgement reaches a monitored mailbox
- [ ] Lead stored: `npx wrangler kv key list --binding LEADS --prefix "lead:"`

> **Check spam explicitly.** A new sending domain has no reputation, and the
> first weeks are when acknowledgements are most likely to be filtered. An
> acknowledgement in spam is worse than none — the sender concludes you never
> replied.

### Verify the records resolve

```bash
dig navadisha.com.np TXT +short | grep spf1
dig selector._domainkey.navadisha.com.np TXT +short
dig _dmarc.navadisha.com.np TXT +short
dig navadisha.com.np MX +short
```

---

## Failure modes, by likelihood

| Symptom | Cause | Fix |
|---|---|---|
| Lead in KV, no emails at all | Sending domain not verified | Complete Part 2 |
| Emails land in spam | DKIM missing, or DMARC misaligned | Verify DKIM; read a DMARC report |
| Notification arrives, acknowledgement does not | Recipient's provider rejected it | Check provider delivery logs |
| SPF check fails | **Two SPF records** | Merge into one |
| Nothing at all, form returns success | **Working as designed** | Worker persists to KV *before* email. Check KV — the lead is safe. |
| Mail to the domain bounces | MX missing, or proxied | Add MX, set DNS-only |

---

## Why a broken email path is invisible

The Worker writes the lead to KV, **then** attempts email. If sending fails the
lead is still captured and recoverable:

```bash
npx wrangler kv key get --binding LEADS "lead:2026-08-17T09:14:22.104Z:uuid"
```

The consequence: **the visitor sees success, you see nothing, and the lead sits
unread.** Nobody reports the failure because nothing looked broken.

This is why:

- The launch-day runbook has an **hourly** KV check
- Operations has a **weekly** KV check until the CRM exists
- A lead in KV with no matching email is the signal that sending is broken

---

## Outstanding

| # | Item | Effort |
|---|---|---|
| 1 | **Confirm the mailbox receives mail** | 15 min |
| 2 | Provider account + API key | 10 min |
| 3 | SPF, DKIM, DMARC records | 15 min |
| 4 | Wait for provider verification | 5 min – 24 h |
| 5 | End-to-end test after Worker deploy | 10 min |

Item 1 is the real blocker and the one most likely to be assumed rather than
checked.
