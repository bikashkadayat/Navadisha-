# Deployment

**Production origin:** `https://navadisha.bikashkadayat.com.np`
**Origin server:** GitHub Pages · **Edge:** Cloudflare (proxied)
**Form backend:** Cloudflare Worker — see [`worker/DEPLOYMENT.md`](../worker/DEPLOYMENT.md)

---

## Architecture

```
Visitor
   │  HTTPS
   ▼
Cloudflare edge  ── CDN · WAF · Brotli · TLS termination
   │  HTTPS (Full strict)
   ▼
GitHub Pages     ── static files, built by GitHub Actions from main
   │
   └── POST /api/contact ──► Cloudflare Worker ──► KV (leads)
                                              └──► transactional email
```

Static hosting has no server, which is why the contact form posts to a Worker
rather than to Pages.

---

## Deploying

Push to `main`. That is the whole process.

```bash
git push origin main
```

`.github/workflows/deploy.yml` runs `npm ci`, then `npm run build` — which
executes **both** `astro build` and `scripts/validate.mjs`. A validation
failure exits non-zero and **fails the deploy**, so a broken link or an
over-length meta description never reaches production.

Watch the run in the **Actions** tab. Expect `24 page(s) built` followed by
`✔ All checks passed`.

### One-time repository setup

Repository: [`bikashkadayat/Navadisha-`](https://github.com/bikashkadayat/Navadisha-),
branch `main`.

**Settings → Pages → Source: `GitHub Actions`** (not "Deploy from a branch").

**Settings → Pages → Custom domain:** `navadisha.bikashkadayat.com.np`

> This is a *project* repository, so without a custom domain the site publishes
> at `bikashkadayat.github.io/Navadisha-/`. The DNS CNAME points at
> `bikashkadayat.github.io`; GitHub routes the custom domain to this project
> once it is set in the repository settings. `base: '/'` in `astro.config.mjs`
> is correct for a custom domain and must not be changed to a subpath.

**Settings → Secrets and variables → Actions → Variables:**

| Variable | Value |
|---|---|
| `SITE_URL` | `https://navadisha.bikashkadayat.com.np` |
| `PUBLIC_FORM_ENDPOINT` | Worker URL, once deployed |
| `PUBLIC_TURNSTILE_SITE_KEY` | Optional |

These are **variables, not secrets** — they are public values compiled into the
client bundle. Storing them as secrets would only make them harder to read
without making them any less public.

The workflow falls back to the correct origin if `SITE_URL` is unset, but set it
anyway: an explicit value survives someone editing the workflow later.

`public/CNAME` contains the hostname and is copied verbatim into the build.
GitHub Pages requires it.

---

## Cloudflare configuration

### DNS

| Type | Name | Content | Proxy |
|---|---|---|---|
| CNAME | `navadisha` | `bikashkadayat.github.io` | Proxied |

Already configured.

### SSL/TLS

| Setting | Value | Why |
|---|---|---|
| Mode | **Full (strict)** | Flexible terminates TLS at the edge and reaches the origin over plain HTTP — with GitHub's HTTPS enforcement that is an infinite redirect loop, and it is insecure regardless |
| Always Use HTTPS | On | |
| Minimum TLS | 1.2 | |
| HSTS | On — see [SECURITY-REVIEW](./SECURITY-REVIEW.md) | |

### Speed

| Setting | Value | Why |
|---|---|---|
| Brotli | **On** | Compresses HTML and CSS. Without it Lighthouse deducts for text compression. |
| Early Hints | On | Free LCP improvement |
| Auto Minify | **Off** | Astro already minifies; doubling up risks breaking output |
| Rocket Loader | **Off** | Reorders scripts — **will break the navigation and form islands** |
| Email Obfuscation | **Off** | Rewrites `mailto:` links and can break the contact page |

> **Rocket Loader and Auto Minify are the two settings most likely to silently
> break this site.** Both default to off on new zones. Confirm rather than
> assume — the symptoms (dead menu, dead form) do not obviously point at a CDN
> setting.

---

## DNS verification

```bash
dig navadisha.bikashkadayat.com.np +short
curl -I https://navadisha.bikashkadayat.com.np
curl -I http://navadisha.bikashkadayat.com.np      # expect 301 → https
curl -s -o /dev/null -w "%{http_code}\n" https://navadisha.bikashkadayat.com.np/nonexistent/   # expect 404
```

- [ ] Resolves through Cloudflare
- [ ] HTTPS returns 200
- [ ] HTTP redirects to HTTPS
- [ ] A bad path returns the 404 page

---

## SSL verification

```bash
echo | openssl s_client -connect navadisha.bikashkadayat.com.np:443 \
  -servername navadisha.bikashkadayat.com.np 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

- [ ] Certificate valid, not expired
- [ ] Covers the hostname
- [ ] No browser warning
- [ ] SSL Labs grade A or better *(optional, but a useful one-time baseline)*

### ⚠ If the certificate is failing

**The proxy is already enabled on your DNS record.** GitHub cannot complete
domain validation through a proxy, so if GitHub has not yet issued its
certificate you will see errors that do not obviously point at the cause.

Recovery sequence:

```
1  Cloudflare → set the record to DNS-only (grey cloud)
2  Wait ~5 minutes
3  GitHub → Settings → Pages → confirm certificate status
      still pending? remove the custom domain, wait 5 min, re-add it
4  Wait for "Certificate issued"          ← do not proceed early
5  GitHub → enable "Enforce HTTPS"
6  Cloudflare → SSL/TLS → Full (strict)   ← BEFORE re-enabling the proxy
7  Cloudflare → switch back to proxied (orange cloud)
```

Once Cloudflare is proxying, visitors see Cloudflare's certificate — but the
origin certificate still matters, because Full (strict) validates it.

---

## Cache purge

Cloudflare caches static assets at the edge. Astro fingerprints CSS and JS
filenames, so those invalidate themselves. **HTML does not** — a content change
can still be served stale.

### Purge a single page

Dashboard → **Caching → Configuration → Purge Custom Purge → by URL**:

```
https://navadisha.bikashkadayat.com.np/about/team/
```

Prefer this. It is fast and does not discard the whole cache.

### Purge everything

Dashboard → **Caching → Purge Everything**.

Use sparingly. It evicts every cached asset globally, so the next visitor in
each region pays full origin latency.

### From the CLI

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://navadisha.bikashkadayat.com.np/about/team/"]}'
```

### When to purge

| Change | Purge needed |
|---|---|
| Content edit, deployed via Actions | Yes — purge the affected URLs |
| CSS or JS change | No — filenames are fingerprinted |
| New image in `public/` | No |
| Replaced image at the same filename | Yes — purge that URL |
| `robots.txt` or sitemap | Yes |

**Verify after purging:**

```bash
curl -sI https://navadisha.bikashkadayat.com.np/about/team/ | grep -i 'cf-cache-status'
```

`MISS` or `EXPIRED` immediately after a purge is correct. `HIT` means the purge
did not take.

---

## Rollback

Full detail in [LAUNCH-CHECKLIST](./LAUNCH-CHECKLIST.md#rollback-checklist).

| Layer | How | Time | Data loss |
|---|---|---|---|
| Bad content | `git revert HEAD && git push` | ~3 min | None |
| Bad deploy | Actions → last good run → **Re-run all jobs** | ~2 min | None |
| DNS | Revert the record | TTL | None |
| Cloudflare setting | Toggle back | Seconds | None |
| Worker | `npx wrangler rollback` or redeploy previous | ~2 min | None — KV untouched |
| **KV namespace** | **No rollback** | — | **Permanent** |

Re-running a previous Actions run is usually faster than reverting a commit and
needs no git operation at all.

> ⚠️ **Never run `wrangler kv namespace delete`, and never bulk-delete `lead:`
> keys.** That store is the enquiry history and the Phase-2 CRM's seed data.
> There is no undo.

### Two rules for any incident

1. **Change one thing at a time.** Changing three settings at once means you
   cannot tell which fixed it — or which caused it.
2. **Write down every change as you make it.** An hour into troubleshooting,
   nobody remembers what they toggled.

### Full stop

To take the site down cleanly: delete the DNS record, remove the custom domain
from GitHub Pages. The site remains reachable at
`bikashkadayat.github.io/<repo>/` for your own testing. Leave the Worker
deployed — it costs nothing and preserves captured leads.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Certificate error | Proxy enabled before GitHub issued its cert | Sequence above |
| Infinite redirect | SSL/TLS set to Flexible | Set Full (strict) |
| 404 on every page | Pages source is a branch, not Actions | Settings → Pages |
| Unstyled or dead interactions | Rocket Loader or Auto Minify on | Turn both off, purge cache |
| Old content after deploy | HTML cached at the edge | Purge the URL |
| Form returns 403 | `ALLOWED_ORIGIN` mismatch | Must match origin exactly, scheme included, no trailing slash |
| Form says "not live yet" | `PUBLIC_FORM_ENDPOINT` unset at build | Set the variable, re-run the workflow |
| Deploy fails at validation | A real defect was caught | Read the output — it names the file and the rule |

**`npx wrangler tail`** streams live Worker requests and is the fastest way to
see what a failing submission actually returned.
