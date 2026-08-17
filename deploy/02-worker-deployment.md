# 2 · Cloudflare Worker deployment

The full guide already lives with the code it describes:

### → **[`worker/DEPLOYMENT.md`](../worker/DEPLOYMENT.md)**

It covers install and auth, the KV namespace, transactional email, Turnstile,
deployment, a nine-command verification suite, reading leads before the CRM
exists, the security posture, and the Phase-2 migration path.

**This page is not a copy of it.** Two documents describing the same procedure
drift apart, and then nobody knows which is current. What follows is only the
launch-day summary and the things that bite.

---

## Launch-day summary

```bash
cd worker
npx wrangler login
npx wrangler kv namespace create LEADS      # paste the id into wrangler.toml
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put TURNSTILE_SECRET    # optional
npx wrangler deploy
```

Then point the site at it — see [#3 step 5](./03-github-repo-init.md):

```
PUBLIC_FORM_ENDPOINT = https://navadisha.com.np/api/contact
```

and rebuild, because the endpoint is baked in at build time.

---

## Four things that bite

**1 · `ALLOWED_ORIGIN` must match the live origin exactly.** Scheme included, no
trailing slash. A mismatch returns 403 on every submission, and it looks like a
broken form rather than a configuration error.

**2 · `NOTIFY_FROM` must be on a verified sending domain.** It is now
`contact@navadisha.com.np`, which is correct — but the domain still needs
verifying with the provider. See [#6](./06-email-verification.md).

**3 · Bind a route on your own domain.** Deploying to `*.workers.dev` works, but
the form then posts to a third-party-looking host at the exact moment a buyer is
deciding whether to trust you. A route on `navadisha.com.np/api/contact` is
same-origin, which also removes the CORS preflight.

**4 · Never clear the `LEADS` namespace.** It is your enquiry history and the
Phase-2 CRM's seed data. A redeploy does not touch it; only an explicit delete
does, and there is no undo.

---

## Verification gate

Do not consider the Worker done until all nine checks in
[`worker/DEPLOYMENT.md`](../worker/DEPLOYMENT.md) pass — particularly:

- [ ] Valid submission returns `{"ok":true}` **and** the lead appears in KV
- [ ] Honeypot submission returns `{"ok":true}` and stores **nothing**
- [ ] Sixth submission from one IP within an hour returns **429**
- [ ] Request from a different origin returns **403**
- [ ] Both emails arrive — notification *and* acknowledgement

The honeypot returning `ok` is intentional. Telling a bot it was detected
teaches whoever wrote it to adapt.

---

## Until it is deployed

The form fails gracefully. It validates client-side, then tells the visitor:

> *"Our message form is not live yet. Please reach us on WhatsApp or by phone —
> both are working, and we will reply within one working day."*

Both alternatives are real and functional. Nobody is left with a form that
silently swallows their message — but the site is also not collecting enquiries
through its primary channel, which is why this is a launch blocker rather than a
nice-to-have.
