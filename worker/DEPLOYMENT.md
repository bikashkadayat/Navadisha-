# Contact form Worker — deployment

The contact form posts to a Cloudflare Worker. **It is not deployed.**

Until it is, the form validates client-side and then tells the visitor plainly
that the message channel is not live, directing them to WhatsApp and phone —
both of which work today. Nobody is left with a form that silently fails.

**Time: ~30 minutes.**

---

## Why a Worker rather than Formspree

1. **Leads land in Navadisha's own datastore from day one.** When the Phase-2
   Django CRM arrives there is real lead history to import rather than a cold
   start. This is the reason that actually matters.
2. **It runs on Navadisha's own domain** — no third-party branding at the moment
   a buyer is deciding whether to trust the firm.
3. **Cloudflare is already in the stack**, so marginal cost is zero.

`LeadPayload` in `src/index.ts` is deliberately shaped to match the Phase-2
Django `Lead` model. When Django goes live the frontend changes one constant —
the endpoint URL — and nothing else.

---

## 1 · Wrangler setup

```bash
cd worker
npx wrangler --version      # bundled via npx; no global install needed
npx wrangler login          # opens a browser
npx wrangler whoami         # confirm the right account
```

If you have more than one Cloudflare account, set the account id in `.env` and
export it, or pass `--account-id` on each command.

---

## 2 · KV setup

```bash
npx wrangler kv namespace create LEADS
```

Copy the returned id into `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "LEADS"
id = "PASTE_THE_ID_HERE"
```

Also record it in `.env` as `CLOUDFLARE_KV_NAMESPACE` for CLI convenience.

> ⚠️ **Do not set a TTL on `lead:*` keys, and never clear this namespace.**
> It is the enquiry history and the Phase-2 CRM's seed data, and there is no
> undo. Rate-limit keys (`rl:*`) carry their own one-hour TTL and expire on
> their own.

---

## 3 · Secret setup

Secrets are stored encrypted at Cloudflare. **They never go in `.env`,
`wrangler.toml` or the repository.**

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put TURNSTILE_SECRET      # optional — see step 4
npx wrangler secret list                       # verify
```

### Email provider

The Worker sends two messages per submission: a notification to Navadisha and an
acknowledgement to the sender. It currently uses Resend.

Confirm in `wrangler.toml`:

```toml
NOTIFY_TO      = "contact@navadisha.com.np"
NOTIFY_FROM    = "contact@navadisha.com.np"
ALLOWED_ORIGIN = "https://navadisha.bikashkadayat.com.np"
```

> **`NOTIFY_FROM` is a domain address, which is correct — but the domain still
> needs verifying with the provider.** Add their DNS records for
> `navadisha.com.np` (SPF, DKIM, and a DMARC record at `p=none` to start).
> Until verification completes, sending fails silently: the lead is still
> stored, because the Worker persists to KV *before* attempting email, but the
> sender receives no confirmation — which reads as if their message vanished.

> **`ALLOWED_ORIGIN` must match the live origin exactly** — scheme included, no
> trailing slash. A mismatch returns 403 on every submission, and it looks like
> a broken form rather than a configuration error.

---

## 4 · Turnstile setup — optional

Cloudflare's privacy-friendly CAPTCHA alternative. **Optional** — the honeypot
and per-IP rate limit already stop ordinary automated submission. Add it if
targeted spam appears.

1. Cloudflare dashboard → **Turnstile → Add site**
2. Domain: `navadisha.bikashkadayat.com.np`
3. Note the **site key** (public) and **secret key** (private)

```bash
npx wrangler secret put TURNSTILE_SECRET
```

Then set `PUBLIC_TURNSTILE_SITE_KEY` as a GitHub repository variable and rebuild
the site. The form renders the widget only when the site key is present, so
nothing breaks if this is deferred indefinitely.

**Turnstile sets no tracking cookie**, which is why it was chosen over
reCAPTCHA — the privacy policy's "this site sets no cookies" claim survives it.

---

## 5 · Deploy

```bash
npx wrangler deploy
```

Note the deployed URL, then set it as the GitHub repository variable
`PUBLIC_FORM_ENDPOINT` and **rebuild the site** — the endpoint is compiled in at
build time.

### Bind a route on your own domain — recommended

Rather than `*.workers.dev`, bind `navadisha.bikashkadayat.com.np/api/contact`.
Same-origin removes the CORS preflight, avoids showing a third-party host to a
visitor mid-decision, and keeps `connect-src 'self'` valid in the CSP.

```toml
# wrangler.toml
[[routes]]
pattern = "navadisha.bikashkadayat.com.np/api/contact"
zone_name = "bikashkadayat.com.np"
```

---

## 6 · Testing commands

Set `ENDPOINT` first:

```bash
export ENDPOINT="https://navadisha.bikashkadayat.com.np/api/contact"
export ORIGIN="https://navadisha.bikashkadayat.com.np"
```

```bash
# 1 · Valid submission — expect {"ok":true} and a stored lead
curl -X POST "$ENDPOINT" -H 'content-type: application/json' -H "origin: $ORIGIN" \
  -d '{"name":"Test","email":"you@example.com","audience":"other","message":"Deployment test"}'

# 2 · Honeypot — expect {"ok":true} and NOTHING stored
curl -X POST "$ENDPOINT" -H 'content-type: application/json' -H "origin: $ORIGIN" \
  -d '{"name":"Bot","email":"b@x.com","audience":"other","message":"spam","website":"filled"}'

# 3 · Invalid payload — expect 400 with a readable message
curl -X POST "$ENDPOINT" -H 'content-type: application/json' -H "origin: $ORIGIN" \
  -d '{"name":"","email":"not-an-email","message":""}'

# 4 · Wrong origin — expect 403
curl -X POST "$ENDPOINT" -H 'content-type: application/json' \
  -H 'origin: https://example.com' \
  -d '{"name":"A","email":"a@b.co","audience":"other","message":"x"}'

# 5 · Rate limit — sixth call within the hour should return 429
for i in $(seq 1 6); do
  curl -s -o /dev/null -w "%{http_code} " -X POST "$ENDPOINT" \
    -H 'content-type: application/json' -H "origin: $ORIGIN" \
    -d '{"name":"T","email":"t@e.co","audience":"other","message":"rate test"}'
done; echo

# 6 · Wrong method — expect 405
curl -s -o /dev/null -w "%{http_code}\n" "$ENDPOINT"

# 7 · Confirm the real lead landed
npx wrangler kv key list --binding LEADS --prefix "lead:"

# 8 · Live logs while testing
npx wrangler tail
```

`wrangler tail` is the most useful of these — it streams live requests and shows
exactly what a failing submission returned.

---

## 7 · Verification checklist

Do not consider the Worker done until every line passes.

- [ ] Valid submission returns `{"ok":true}`
- [ ] Lead appears under a `lead:` key in KV
- [ ] Notification email arrives at `contact@navadisha.com.np`
- [ ] Acknowledgement email arrives at the sender's address
- [ ] Acknowledgement lands in **inbox, not spam**
- [ ] Sender shows as `contact@navadisha.com.np`, not a provider default
- [ ] Honeypot submission returns ok and stores **nothing**
- [ ] Invalid payload returns 400 with a readable message, never a stack trace
- [ ] Sixth submission from one IP within an hour returns 429
- [ ] Request from a different origin returns 403
- [ ] `GET` returns 405
- [ ] Submitting from the **live site** shows the success state
- [ ] `PUBLIC_FORM_ENDPOINT` set and the site rebuilt

> **Check spam explicitly.** A new sending domain has no reputation, and the
> first weeks are when acknowledgements are most likely to be filtered. An
> acknowledgement in spam is worse than none — the sender concludes you never
> replied.

---

## Reading leads before the CRM exists

```bash
npx wrangler kv key list --binding LEADS --prefix "lead:"
npx wrangler kv key get --binding LEADS "lead:2026-08-17T09:14:22.104Z:uuid"
```

Keys are ISO-timestamp prefixed, so they list chronologically.

**Check weekly.** A lead in KV with no matching email means the email path is
broken — a failure invisible from the outside, because the visitor saw success.

---

## Security posture

| Layer | Mechanism |
|---|---|
| Origin | Non-matching origin rejected with 403 |
| Honeypot | Hidden `website` field; filled → accepted, never stored |
| Rate limit | 5 submissions per IP per hour, 429 beyond |
| Turnstile | Server-side token verification when configured |
| Validation | Server-side; the client pass is convenience only |
| Payload cap | Message limited to 5,000 characters |
| Storage | Persist to KV **before** email, so delivery failure never loses a lead |

The honeypot deliberately returns `{"ok":true}`. Telling a bot it was detected
teaches whoever wrote it to adapt.

---

## Rollback

```bash
npx wrangler deployments list
npx wrangler rollback [deployment-id]
```

**KV is untouched by a rollback or redeploy.** Only an explicit delete removes
data, and there is no undo.

---

## Phase-2 migration

1. Export KV — `wrangler kv key list --prefix "lead:"`, fetch each value, import
   into the Django `Lead` table. **The JSON shape already matches.**
2. Point `PUBLIC_FORM_ENDPOINT` at the Django route
3. Retire the Worker, or keep it as a queue in front of Django

No frontend change beyond the endpoint constant.
