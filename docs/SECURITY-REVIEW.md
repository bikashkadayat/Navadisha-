# Security review

Reviewed 17 August 2026 against the built output. **Findings are measured, not
assumed** — each claim below was verified against `dist/`.

---

## Summary

| Area | State | Action |
|---|---|---|
| Third-party requests | **Zero** | ✅ verified |
| Cookies set | **Zero** | ✅ verified |
| TLS / Cloudflare SSL | Full (strict) | ✅ configure |
| HSTS | **Not enabled** | ⚠️ enable at Cloudflare |
| Security headers | **None present** | ⚠️ add Transform Rule |
| CSP | **Not present** | ⚠️ add — see caveat |
| Form abuse protection | 4 layers active | ✅ verified in code |
| Turnstile | Supported, not configured | Optional |
| Secrets in repository | **None** | ✅ verified |

The site's baseline is unusually good: it loads nothing from anyone else and
sets no cookies, which removes most of the attack surface a typical marketing
site carries. **What is missing is response headers**, and that is a Cloudflare
configuration task rather than a code change.

---

## 1 · Attack surface — verified

```
external hosts referenced in built HTML:
  https://navadisha.bikashkadayat.com.np    (self)
  https://wa.me                             (link target only — not a resource load)

cookies set:            0
analytics:              none
tracking pixels:        none
embedded iframes:       none
third-party fonts:      none — all self-hosted WOFF2
third-party scripts:    none
```

No CDN, no font provider, no map embed, no social widget, no consent banner.
Loading a page tells no third party anything.

---

## 2 · Security headers — the gap

**GitHub Pages cannot set custom response headers.** There is no `_headers`
file support and no server configuration. Every header below must be added at
Cloudflare.

### Cloudflare → Rules → Transform Rules → Modify Response Header

Create one rule, `Security headers`, matching **all incoming requests**, and set:

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Frame-Options` | `DENY` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` |
| `Cross-Origin-Opener-Policy` | `same-origin` |

### On HSTS specifically

Enable via **SSL/TLS → Edge Certificates → HTTP Strict Transport Security**.

> **HSTS is a commitment, not a toggle.** Once a browser sees the header it will
> refuse plain HTTP for `max-age`, and clearing that early is not possible from
> the server side. Start at `max-age=86400` (one day), confirm nothing breaks
> for a week, then raise to a year.
>
> `includeSubDomains` on `navadisha.bikashkadayat.com.np` affects only that
> hostname's children, not the parent domain — but be deliberate about it.
>
> **Do not enable `preload` yet.** Getting onto the preload list is easy;
> getting off it takes months.

### Verify

```bash
curl -sI https://navadisha.bikashkadayat.com.np | grep -iE \
  'strict-transport|x-content-type|referrer-policy|x-frame|permissions-policy|content-security'
```

- [ ] All six present
- [ ] `securityheaders.com` grade A or better

---

## 3 · Content Security Policy — with an honest caveat

A CSP is worth adding, but **this build cannot use a strict one without a
change to how scripts are emitted.** Measured in the current output:

```
inline <script> blocks:  43     (includes JSON-LD and Astro islands)
inline <style> blocks:   21     (Astro-scoped component styles)
```

A strict CSP requires either a per-script hash or a nonce. Hashes change on
every build, so a static Cloudflare rule would break at the next deploy; nonces
require a server, which static hosting does not have.

### Recommended CSP — meaningful protection, honest about inline

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
font-src 'self';
connect-src 'self';
form-action 'self';
frame-ancestors 'none';
base-uri 'self';
object-src 'none';
upgrade-insecure-requests
```

**What this genuinely buys**, even with `'unsafe-inline'`:

- No script may load from any external origin
- No page may be framed — clickjacking blocked at the browser
- Forms cannot post anywhere but this origin
- `<base>` cannot be hijacked to rewrite relative URLs
- No plugins or objects
- All resources upgraded to HTTPS

**What it does not buy:** protection against an injected inline script. That
requires eliminating inline scripts, which is a build-configuration change and
is out of scope for this phase.

> **If `PUBLIC_FORM_ENDPOINT` points at a `*.workers.dev` address rather than a
> route on this domain, `connect-src 'self'` will block form submission.**
> Either bind the Worker to `/api/contact` on this domain — recommended anyway —
> or add the workers.dev origin to `connect-src`.

### Path to a strict CSP — future work

1. Configure Astro to emit all scripts as external files rather than inline
2. Drop `'unsafe-inline'` from `script-src`
3. Keep it on `style-src` — Astro's scoped styles need it, and injected CSS is a
   far weaker vector than injected JS

Deploy CSP in `Content-Security-Policy-Report-Only` first and watch for a week.
Shipping a strict CSP straight to enforcing mode is how sites break silently.

---

## 4 · Form abuse protection — verified in `worker/src/index.ts`

Four independent layers, all present in code:

| Layer | Mechanism | Behaviour |
|---|---|---|
| **Origin check** | Rejects requests whose `Origin` does not match `ALLOWED_ORIGIN` | 403 |
| **Honeypot** | Hidden `website` field; people never fill it, bots do | Returns `{"ok":true}` and stores **nothing** |
| **Rate limit** | 5 submissions per IP per hour, in KV with a 1-hour TTL | 429 |
| **Turnstile** | Server-side token verification when configured | 400 on failure |

Plus server-side validation independent of the client pass, and a 5,000
character cap on the message body.

**The honeypot deliberately returns success.** Telling a bot it was detected
teaches whoever wrote it to adapt.

### Persist-before-send

The Worker writes the lead to KV **before** attempting email. Delivery failure
therefore never loses an enquiry.

The consequence to be aware of: **a broken email path is invisible from the
outside.** The visitor sees success, you see nothing, and the lead sits unread
in KV. Check KV weekly until the CRM exists.

### Verify after deploying

```bash
# honeypot — expect {"ok":true}, and NO new key in KV
curl -X POST "$ENDPOINT" -H 'content-type: application/json' \
  -d '{"name":"Bot","email":"b@x.com","audience":"other","message":"x","website":"filled"}'

# wrong origin — expect 403
curl -X POST "$ENDPOINT" -H 'content-type: application/json' \
  -H 'origin: https://example.com' -d '{"name":"A","email":"a@b.co","audience":"other","message":"x"}'

# rate limit — sixth call within an hour should return 429
for i in $(seq 1 6); do curl -s -o /dev/null -w "%{http_code} " -X POST "$ENDPOINT" \
  -H 'content-type: application/json' -H "origin: https://navadisha.bikashkadayat.com.np" \
  -d '{"name":"T","email":"t@e.co","audience":"other","message":"rate test"}'; done; echo
```

- [ ] Honeypot returns ok, stores nothing
- [ ] Wrong origin returns 403
- [ ] Sixth request returns 429
- [ ] Malformed JSON returns 400 with a readable message, never a stack trace

---

## 5 · Turnstile

Optional. The honeypot and rate limit handle ordinary automated submission;
Turnstile is the escalation if targeted spam appears.

```bash
cd worker && npx wrangler secret put TURNSTILE_SECRET
# then set PUBLIC_TURNSTILE_SITE_KEY as a repository variable and rebuild
```

The form renders the widget only when the site key is present, so nothing breaks
if this is deferred indefinitely.

**Privacy note:** Turnstile sets no tracking cookie, which is why it was chosen
over reCAPTCHA — the privacy policy's "this site sets no cookies" claim survives
enabling it. Re-read that page before adding any other third-party widget.

---

## 6 · Secrets — verified

```
.gitignore excludes:  .env  .env.*  (with !.env.example)
secrets in repo:      none
```

| Secret | Where it lives |
|---|---|
| `RESEND_API_KEY` | `wrangler secret` — encrypted at Cloudflare |
| `TURNSTILE_SECRET` | `wrangler secret` |
| `CLOUDFLARE_API_TOKEN` | Local shell only, never committed |

`worker/wrangler.toml` **is** committed and contains no secrets — only
non-sensitive vars and the KV namespace id.

> **If a secret ever lands in a commit, rotate it.** Removing the commit is not
> enough; the value was pushed and must be assumed compromised.

---

## 7 · Dependency and supply chain

```bash
npm audit --omit=dev
```

Dependencies are Astro, `@astrojs/sitemap`, Tailwind and `@tailwindcss/vite` —
a deliberately small tree. No analytics SDK, no UI framework, no icon package.

The build output ships **~4.25 KB of first-party JavaScript and nothing else**,
so a compromised transitive dependency has no runtime path to a visitor unless
it corrupts the build itself.

- [ ] `npm audit` run before each release
- [ ] Dependabot enabled on the repository *(recommended)*

---

## Outstanding actions

| # | Action | Effort | Priority |
|---|---|---|---|
| 1 | Add the security-headers Transform Rule | 10 min | High |
| 2 | Enable HSTS at `max-age=86400`, raise after a week | 5 min | High |
| 3 | Add CSP in Report-Only, then enforce | 20 min | Medium |
| 4 | Bind the Worker to `/api/contact` on this domain | 10 min | Medium |
| 5 | Enable Dependabot | 2 min | Low |
| 6 | Turnstile | 15 min | Only if spam appears |

None of these blocks launch. Items 1 and 2 are worth doing the same week.
