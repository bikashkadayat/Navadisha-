# 6 · Email verification checklist

The contact form generates two emails per submission: a **notification** to
Navadisha and an **acknowledgement** to the sender. Both fail silently until the
sending domain is verified.

---

## The distinction that trips people up

**Sending and receiving are different services.**

| | Service | Needed for |
|---|---|---|
| **Sending** | Resend (or equivalent) | The two emails the Worker generates |
| **Receiving** | Google Workspace, Zoho Mail, or your registrar's hosting | Someone actually reading `contact@navadisha.com.np` |

Resend can send *as* `contact@navadisha.com.np`. It cannot deliver mail *to* it.

> **Confirm before launch: does `contact@navadisha.com.np` receive mail today?**
> Send it a message from an unrelated address and check it arrives. The address
> is published on nine pages and is the destination for every form submission —
> if nobody can read it, enquiries vanish into nothing and the site looks
> unresponsive rather than broken.
>
> Zoho Mail has a free tier for a single custom domain, which is usually the
> fastest route if no mailbox exists yet.

---

## Part 1 — Receiving

- [ ] Mailbox provider chosen
- [ ] MX records added for `navadisha.com.np` (provider supplies them)
- [ ] MX records are **grey cloud / DNS-only** — Cloudflare cannot proxy mail
- [ ] Test message from an outside address arrives
- [ ] Reply from that mailbox arrives at the outside address
- [ ] Someone checks it daily — the site promises a reply within one working day

---

## Part 2 — Sending

### Add the provider's DNS records

Your provider gives you exact values. What each does:

| Record | Purpose | Notes |
|---|---|---|
| **SPF** (TXT) | Lists who may send as your domain | **One SPF record per domain.** If you already have one for the mailbox provider, *merge* the includes — two SPF records is a hard failure, not a warning. |
| **DKIM** (TXT or CNAME) | Cryptographic signature proving the mail is yours | Long value; paste carefully |
| **DMARC** (TXT at `_dmarc`) | Tells receivers what to do when SPF/DKIM fail | Start permissive |

A reasonable starting DMARC:

```
_dmarc.navadisha.com.np   TXT   "v=DMARC1; p=none; rua=mailto:contact@navadisha.com.np"
```

`p=none` monitors without rejecting. Tighten to `quarantine` after a few weeks
of clean reports. Starting at `p=reject` risks blackholing your own mail before
you know whether alignment is correct.

- [ ] SPF added — **exactly one** SPF record on the domain
- [ ] DKIM added
- [ ] DMARC added at `p=none`
- [ ] All three **grey cloud / DNS-only**
- [ ] Provider dashboard reports the domain **Verified**

### Wire the Worker

```bash
cd worker
npx wrangler secret put RESEND_API_KEY
```

Confirm in `wrangler.toml`:

```toml
NOTIFY_TO   = "contact@navadisha.com.np"   # where enquiries land
NOTIFY_FROM = "contact@navadisha.com.np"   # must be on the verified domain
```

- [ ] `NOTIFY_FROM` is on the verified domain — a `gmail.com` sender is rejected
- [ ] `RESEND_API_KEY` set as a secret, never committed

---

## Part 3 — End-to-end test

Run this **after** the Worker is deployed. Use a real address you can check,
ideally on a different provider than the mailbox.

```bash
curl -X POST "$ENDPOINT" \
  -H 'content-type: application/json' \
  -H "origin: https://navadisha.com.np" \
  -d '{"name":"Deployment Test","email":"you@example.com","audience":"other","message":"End-to-end email test"}'
```

- [ ] Response `{"ok":true}`
- [ ] Notification arrives at `contact@navadisha.com.np`
- [ ] Acknowledgement arrives at the test address
- [ ] Acknowledgement lands in **inbox, not spam**
- [ ] Sender shows as `contact@navadisha.com.np`, not a provider default
- [ ] Reply-to works — replying reaches a monitored mailbox
- [ ] Lead stored: `npx wrangler kv key list --binding LEADS --prefix "lead:"`

> **Check spam explicitly.** A new sending domain has no reputation, and the
> first weeks are when acknowledgements are most likely to be filtered. An
> acknowledgement in spam is worse than none — the sender concludes you never
> replied.

---

## Failure modes, ranked by likelihood

| Symptom | Cause | Fix |
|---|---|---|
| Lead stored, no emails | Domain not verified | Complete Part 2 |
| Emails to spam | No DKIM, or DMARC misaligned | Verify DKIM; check a report |
| Notification arrives, acknowledgement does not | Recipient's provider rejected it | Check provider logs |
| Nothing at all, `{"ok":true}` returned | Working as designed | The Worker persists to KV **before** email, so delivery failure never loses a lead. Check KV to confirm. |
| SPF check fails | Two SPF records | Merge into one |

---

## Why persist-before-send matters

The Worker writes to KV, *then* attempts email. If email fails the lead is still
captured and recoverable with `wrangler kv key get`.

The consequence to be aware of: **a broken email path is invisible from the
outside.** The visitor sees a success message, you see nothing, and the lead
sits in KV unread. Hence the end-to-end test above, and the KV check in the
first-week routine.
