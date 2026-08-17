# Worker deployment — audit and checklist

**Audited:** 17 August 2026 against `worker/src/index.ts` and `worker/wrangler.toml`
**Status:** ✅ Code ready · ⚠️ **Not deployed** · ⚠️ One value outstanding

Step-by-step procedure: [`worker/DEPLOYMENT.md`](../worker/DEPLOYMENT.md).
This document is the **audit and verification gate**, not a second copy of it.

---

## Audit summary

| Item | State |
|---|---|
| `wrangler.toml` structure | ✅ Valid |
| KV binding declared | ✅ `LEADS` |
| KV namespace id | ⚠️ **Empty — must be filled** |
| `ALLOWED_ORIGIN` | ✅ Matches production origin exactly |
| `NOTIFY_TO` / `NOTIFY_FROM` | ✅ Domain address |
| Turnstile integration | ✅ Optional-by-design, correctly gated |
| Secrets | ✅ None in the repository |
| Abuse protection | ✅ Four independent layers |
| Deployment | ⚠️ **Not run** |

---

## 1 · `wrangler.toml`

```toml
name = "navadisha-forms"
main = "src/index.ts"
compatibility_date = "2025-01-01"

[vars]
NOTIFY_TO      = "contact@navadisha.com.np"
NOTIFY_FROM    = "contact@navadisha.com.np"
ALLOWED_ORIGIN = "https://navadisha.bikashkadayat.com.np"

[[kv_namespaces]]
binding = "LEADS"
id = ""            # ⚠ OUTSTANDING
```

| Field | Assessment |
|---|---|
| `name` | ✅ |
| `main` | ✅ Points at the Worker source |
| `compatibility_date` | ✅ Pinned — prevents runtime behaviour drifting under you |
| `NOTIFY_TO` | ✅ Where enquiries land |
| `NOTIFY_FROM` | ✅ Domain address, not gmail — **but the domain still needs verifying** |
| `ALLOWED_ORIGIN` | ✅ **Exact match**, scheme included, no trailing slash |
| `[[kv_namespaces]].id` | ⚠️ **Empty.** The single outstanding value. |

> **`ALLOWED_ORIGIN` correctness matters more than it looks.** A mismatch
> returns 403 on every submission, and the symptom reads as a broken form
> rather than a configuration error. Verified character-for-character against
> the production origin.

**No secrets in this file.** It is committed, and correctly contains only
non-sensitive values.

---

## 2 · KV bindings

| Check | Result |
|---|---|
| Binding name matches code (`env.LEADS`) | ✅ |
| Namespace created | ⚠️ **Not yet** |
| Id pasted into `wrangler.toml` | ⚠️ **Outstanding** |
| Key scheme | ✅ `lead:<ISO-timestamp>:<uuid>` — lists chronologically |
| Lead keys carry a TTL | ✅ **No** — correct; they must persist |
| Rate-limit keys carry a TTL | ✅ Yes, 3600s — self-expiring |

```bash
npx wrangler kv namespace create LEADS
# paste the returned id into wrangler.toml AND .env (CLOUDFLARE_KV_NAMESPACE)
```

> ⚠️ **This namespace is the enquiry history and the Phase-2 CRM's seed data.**
> Never delete it, never bulk-delete `lead:` keys, never add a TTL to them.
> There is no undo. A redeploy does not touch it; only an explicit delete does.

---

## 3 · Turnstile integration

**Audited in code — correctly optional.**

```ts
if (env.TURNSTILE_SECRET && !(await verifyTurnstile(...))) { … }
```

Verification runs **only when the secret is configured**. Without it, the form
still has a honeypot and per-IP rate limiting. The frontend mirrors this: the
widget renders only when `PUBLIC_TURNSTILE_SITE_KEY` is present.

✅ Nothing breaks if Turnstile is deferred indefinitely.

| Step | Needed |
|---|---|
| Cloudflare → Turnstile → Add site | Domain: `navadisha.bikashkadayat.com.np` |
| Secret key | `npx wrangler secret put TURNSTILE_SECRET` |
| Site key | Repository variable `PUBLIC_TURNSTILE_SITE_KEY`, then rebuild |

**Privacy:** Turnstile sets no tracking cookie — the privacy policy's "this site
sets no cookies" claim survives enabling it. That was the reason for choosing it
over reCAPTCHA.

**Recommendation:** deploy without it. Add it only if spam actually appears.

---

## 4 · Environment variables

| Name | Type | Where it lives | State |
|---|---|---|---|
| `NOTIFY_TO` | var | `wrangler.toml` | ✅ Set |
| `NOTIFY_FROM` | var | `wrangler.toml` | ✅ Set |
| `ALLOWED_ORIGIN` | var | `wrangler.toml` | ✅ Set |
| `LEADS` | KV binding | `wrangler.toml` | ⚠️ Id empty |
| `RESEND_API_KEY` | **secret** | `wrangler secret` | ⚠️ Not set |
| `TURNSTILE_SECRET` | **secret** | `wrangler secret` | Optional |
| `PUBLIC_FORM_ENDPOINT` | build var | GitHub repo variable | ⚠️ Not set |

**Secrets never appear in `.env`, `wrangler.toml` or the repository.** They are
set with `wrangler secret put` and stored encrypted at Cloudflare. Verified: no
secret material is committed.

> If a secret ever lands in a commit, **rotate it**. Removing the commit is not
> enough — the value was pushed and must be assumed compromised.

---

## 5 · Abuse protection — verified in code

| Layer | Mechanism | Response |
|---|---|---|
| Origin check | `Origin` header vs `ALLOWED_ORIGIN` | 403 |
| Honeypot | Hidden `website` field | `{"ok":true}`, stores **nothing** |
| Rate limit | 5 per IP per hour, KV-backed, 1h TTL | 429 |
| Turnstile | Server-side token verification when configured | 400 |
| Validation | Server-side, independent of the client pass | 400 |
| Payload cap | Message ≤ 5,000 characters | 400 |

**The honeypot deliberately returns success.** Telling a bot it was detected
teaches whoever wrote it to adapt.

### Persist-before-send

The Worker writes to KV **before** attempting email, so delivery failure never
loses an enquiry.

> **Consequence worth internalising: a broken email path is invisible from the
> outside.** The visitor sees success, you see nothing, and the lead sits unread
> in KV. This is why the runbook has an hourly KV check on launch day and a
> weekly one afterwards.

---

## 6 · Deployment commands

```bash
cd worker
npx wrangler login
npx wrangler whoami                          # confirm the right account

npx wrangler kv namespace create LEADS       # → paste id into wrangler.toml
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put TURNSTILE_SECRET     # optional
npx wrangler secret list                     # verify

npx wrangler deploy
npx wrangler tail                            # live logs
```

### Bind a route on your own domain — recommended

```toml
[[routes]]
pattern = "navadisha.bikashkadayat.com.np/api/contact"
zone_name = "bikashkadayat.com.np"
```

Three reasons: no CORS preflight, no third-party-looking host shown to a visitor
mid-decision, and `connect-src 'self'` stays valid in the CSP.

---

## 7 · Verification gate

**Do not consider the Worker done until every line passes.**

```bash
export ENDPOINT="https://navadisha.bikashkadayat.com.np/api/contact"
export ORIGIN="https://navadisha.bikashkadayat.com.np"
```

### Functional

- [ ] Valid submission → `{"ok":true}`
      ```bash
      curl -X POST "$ENDPOINT" -H 'content-type: application/json' -H "origin: $ORIGIN" \
        -d '{"name":"Test","email":"you@example.com","audience":"other","message":"Deployment test"}'
      ```
- [ ] Lead appears in KV
      ```bash
      npx wrangler kv key list --binding LEADS --prefix "lead:"
      ```
- [ ] Notification email arrives at `contact@navadisha.com.np`
- [ ] Acknowledgement arrives at the sender — **check spam**
- [ ] Sender shows as `contact@navadisha.com.np`, not a provider default

### Security

- [ ] Honeypot → `{"ok":true}` and **no new KV key**
      ```bash
      curl -X POST "$ENDPOINT" -H 'content-type: application/json' -H "origin: $ORIGIN" \
        -d '{"name":"Bot","email":"b@x.com","audience":"other","message":"x","website":"filled"}'
      ```
- [ ] Wrong origin → **403**
      ```bash
      curl -s -o /dev/null -w "%{http_code}\n" -X POST "$ENDPOINT" \
        -H 'content-type: application/json' -H 'origin: https://example.com' \
        -d '{"name":"A","email":"a@b.co","audience":"other","message":"x"}'
      ```
- [ ] Sixth request within the hour → **429**
      ```bash
      for i in $(seq 1 6); do curl -s -o /dev/null -w "%{http_code} " -X POST "$ENDPOINT" \
        -H 'content-type: application/json' -H "origin: $ORIGIN" \
        -d '{"name":"T","email":"t@e.co","audience":"other","message":"rate"}'; done; echo
      ```
- [ ] Invalid payload → **400** with a readable message, never a stack trace
- [ ] `GET` → **405**

### Integration

- [ ] `PUBLIC_FORM_ENDPOINT` repository variable set
- [ ] Site rebuilt — **the endpoint is compiled in at build time**
- [ ] Submitting from the **live site** shows the success state

---

## Outstanding before launch

| # | Item | Effort |
|---|---|---|
| 1 | Create the KV namespace, paste the id | 2 min |
| 2 | Set `RESEND_API_KEY` | 5 min |
| 3 | Verify the sending domain — [EMAIL-SETUP](./EMAIL-SETUP.md) | 15 min |
| 4 | `wrangler deploy` | 1 min |
| 5 | Run the verification gate | 10 min |
| 6 | Set `PUBLIC_FORM_ENDPOINT`, rebuild | 5 min |

**Total ≈ 40 minutes.** Items 2 and 3 belong in the same sitting — deploying
without a verified sending domain gives you a form that stores leads correctly
but never confirms receipt, which reads to the sender as if their message
vanished.

---

## Until deployed

The form fails gracefully:

> *"Our message form is not live yet. Please reach us on WhatsApp or by phone —
> both are working, and we will reply within one working day."*

Both alternatives are real. Nobody is left with a form that silently swallows a
message — but the site is not collecting enquiries through its primary channel,
which is why this is a launch blocker rather than a nice-to-have.
