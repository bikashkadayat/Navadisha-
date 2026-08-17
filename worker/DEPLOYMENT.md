# Contact form Worker — deployment

The contact form posts to a Cloudflare Worker. **It is not deployed.** Until it
is, the form validates client-side and then tells the visitor plainly that the
message channel is not live, directing them to WhatsApp and phone — both of
which work today. Nobody is left staring at a form that silently fails.

Total time: roughly 30 minutes.

---

## Why a Worker rather than Formspree or Netlify Forms

Three reasons, in order of importance:

1. **Leads land in Navadisha's own datastore from day one.** When the Phase-2
   Django CRM arrives there is real lead history to import rather than a cold
   start. This is the reason that actually matters.
2. **It runs on Navadisha's own domain.** No third-party branding at the exact
   moment a buyer is deciding whether to trust the firm.
3. **Cloudflare is already in the stack**, so marginal cost is zero.

The Worker's `LeadPayload` interface is deliberately shaped to match the
Phase-2 Django `Lead` model. When Django goes live, the frontend changes one
constant — the endpoint URL — and nothing else.

---

## 1 · Install and authenticate

```bash
cd worker
npx wrangler login
```

## 2 · Create the KV namespace

```bash
npx wrangler kv namespace create LEADS
```

Copy the returned `id` into `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "LEADS"
id = "PASTE_THE_ID_HERE"
```

> **Do not set a TTL on `lead:*` keys, and do not clear this namespace between
> deploys.** It is the Phase-2 CRM's seed data. Rate-limit keys (`rl:*`) carry
> their own one-hour TTL and expire on their own.

## 3 · Transactional email

The Worker sends two emails per submission: a notification to Navadisha and an
acknowledgement to the sender. It currently uses Resend.

1. Create an account and verify a sending domain.
2. Create an API key.

```bash
npx wrangler secret put RESEND_API_KEY
```

> **`NOTIFY_FROM` is now `contact@navadisha.com.np` — a domain address, which
> resolves the earlier gmail-sender problem.** You still need to verify the
> `navadisha.com.np` domain with the email provider (add their DNS records)
> before sending will work. Until that verification completes the
> acknowledgement email fails silently: the lead is still stored, because the
> Worker persists to KV *before* attempting email, but the sender receives no
> confirmation — which reads as if their message vanished.

## 4 · Turnstile (recommended, optional)

Cloudflare's privacy-friendly CAPTCHA alternative. Without it the form still has
a honeypot and per-IP rate limiting, which stops most automated submission.

1. Cloudflare dashboard → Turnstile → Add site.
2. Note the **site key** (public) and **secret key** (private).

```bash
npx wrangler secret put TURNSTILE_SECRET
```

Then add the site key to the Astro build environment:

```bash
# .env  (git-ignored)
PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAA...
```

The form renders the widget only when this variable is present, so nothing
breaks if you defer this step.

## 5 · Deploy

```bash
npx wrangler deploy
```

Note the deployed URL, then point the frontend at it:

```bash
# .env  (git-ignored)
PUBLIC_FORM_ENDPOINT=https://navadisha-forms.<subdomain>.workers.dev/
```

Rebuild the site so the endpoint is baked in:

```bash
cd .. && npm run build
```

> **Better:** bind a route on the site's own domain — e.g.
> `navadisha.bikashkadayat.com.np/api/contact` — so the form does not post to a
> `workers.dev` address. Same-origin also removes the CORS preflight.

---

## 6 · Verify before trusting it

```bash
# Should return {"ok":true} and store a lead
curl -X POST "$ENDPOINT" \
  -H 'content-type: application/json' \
  -H "origin: https://navadisha.bikashkadayat.com.np" \
  -d '{"name":"Test","email":"you@example.com","audience":"other","message":"Deployment test"}'

# Should return {"ok":true} but store NOTHING — honeypot triggered
curl -X POST "$ENDPOINT" -H 'content-type: application/json' \
  -d '{"name":"Bot","email":"b@x.com","audience":"other","message":"spam","website":"filled"}'

# Should return a 400 with a readable error
curl -X POST "$ENDPOINT" -H 'content-type: application/json' \
  -d '{"name":"","email":"not-an-email","message":""}'

# Confirm the real lead landed
npx wrangler kv key list --binding LEADS | grep '^lead:'
```

**Checklist:**

- [ ] Valid submission returns `{"ok":true}`
- [ ] Lead appears under a `lead:` key in KV
- [ ] Notification email arrives at `navadisha@gmail.com`
- [ ] Acknowledgement email arrives at the sender's address
- [ ] Honeypot submission returns ok but stores nothing
- [ ] Invalid submission returns 400 with a readable message
- [ ] Sixth submission from one IP within an hour returns 429
- [ ] Request from a different origin returns 403
- [ ] Submitting from the live site shows the success state

---

## Reading leads before the CRM exists

```bash
npx wrangler kv key list --binding LEADS --prefix "lead:"
npx wrangler kv key get --binding LEADS "lead:2026-08-16T...:uuid"
```

Keys are prefixed with an ISO timestamp, so they list in chronological order.

---

## Security posture

| Layer | Mechanism |
|---|---|
| Origin | Requests from other origins rejected with 403 |
| Honeypot | Hidden `website` field; filled → silently accepted, never stored |
| Rate limit | 5 submissions per IP per hour, 429 beyond |
| Turnstile | Server-side token verification when configured |
| Validation | Server-side; the client-side pass is convenience only |
| Payload cap | Message limited to 5,000 characters |
| Storage | Persist to KV **before** email, so delivery failure never loses a lead |

The honeypot deliberately returns `{"ok":true}`. Telling a bot it was detected
teaches whoever wrote it to adapt.

---

## Phase-2 migration

When the Django CRM lands:

1. Export KV: `npx wrangler kv key list --binding LEADS --prefix "lead:"`, fetch
   each value, import into the `Lead` table. The JSON shape already matches.
2. Point `PUBLIC_FORM_ENDPOINT` at the Django route.
3. Retire the Worker, or keep it as a queue in front of Django.

No frontend change is required beyond the endpoint constant.
