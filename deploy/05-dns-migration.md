# 5 · DNS migration checklist

Execution detail for [#4](./04-domain-cutover.md). Read that first — the
**order** of these steps matters more than the records themselves.

> This is a first-time setup, not a migration from a live site. There is no
> existing traffic to protect, which removes most of the usual risk. The main
> hazard is the certificate-ordering trap described in #4.

---

## Before you start

- [ ] Registrar nameservers point at Cloudflare, and the zone shows **Active**
- [ ] Your GitHub Pages URL is known: `<owner>.github.io`
- [ ] TTL set to **300 seconds** for anything you might need to change back

---

## Records for the site

### Apex — `navadisha.com.np`

Cloudflare supports CNAME flattening at the apex, which is simpler and stays
correct if GitHub changes its IPs.

| Type | Name | Content | Proxy | TTL |
|---|---|---|---|---|
| CNAME | `@` | `<owner>.github.io` | **Grey → Orange** | Auto |

If flattening is unavailable, use A records instead:

| Type | Name | Content |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

*Verify these against GitHub's current documentation before relying on them —
published IPs change, and a stale list produces a site that resolves nowhere.*

### `www` redirect

| Type | Name | Content | Proxy |
|---|---|---|---|
| CNAME | `www` | `navadisha.com.np` | Orange |

Then **Rules → Redirect Rules**: `www.navadisha.com.np/*` → `https://navadisha.com.np/$1`, 301.

Pick one canonical host and redirect the other. Serving both without a redirect
splits ranking signals between two identical sites.

### Subdomain option — `navadisha.bikashkadayat.com.np`

| Type | Name | Content | Proxy |
|---|---|---|---|
| CNAME | `navadisha` | `<owner>.github.io` | **Grey → Orange** |

---

## The grey-to-orange sequence

- [ ] Create the record with the proxy **OFF** (grey cloud)
- [ ] `dig navadisha.com.np +short` returns GitHub, not a Cloudflare IP
- [ ] GitHub Pages → Custom domain → enter hostname → save
- [ ] GitHub shows **"DNS check successful"**
- [ ] Wait for **"Certificate issued"** — do not proceed early
- [ ] Enable **Enforce HTTPS**
- [ ] Cloudflare → SSL/TLS → Overview → **Full (strict)**
- [ ] Switch the record to **orange cloud**
- [ ] `curl -I https://navadisha.com.np` returns 200 with a valid certificate

---

## Cloudflare settings once proxied

| Setting | Value | Why |
|---|---|---|
| SSL/TLS mode | **Full (strict)** | Flexible causes a redirect loop and is insecure |
| Always Use HTTPS | On | |
| Automatic HTTPS Rewrites | On | |
| Minimum TLS | 1.2 | |
| Brotli | On | **This clears the one Lighthouse deduction** — the local test server did not compress |
| Early Hints | On | Free LCP improvement |
| Auto Minify | **Off** | Astro already minifies; doubling up risks breaking output |
| Rocket Loader | **Off** | Reorders scripts and will break the nav and form islands |
| Email Obfuscation | **Off** | Rewrites `mailto:` links and can break the contact page |

> **Rocket Loader and Auto Minify are the two settings most likely to silently
> break this site.** Both are off by default on new zones; confirm rather than
> assume.

---

## Verification

```bash
dig navadisha.com.np +short
dig www.navadisha.com.np +short
curl -I https://navadisha.com.np
curl -I http://navadisha.com.np          # expect 301 → https
curl -I https://www.navadisha.com.np     # expect 301 → apex
curl -s https://navadisha.com.np/robots.txt
curl -s -o /dev/null -w "%{http_code}\n" https://navadisha.com.np/nonexistent-page/   # expect 404
```

- [ ] Certificate valid, no browser warning
- [ ] HTTP redirects to HTTPS
- [ ] `www` redirects to the canonical host
- [ ] Canonical tags in the page source match the live host
- [ ] `/sitemap-index.xml` lists the correct host
- [ ] 404 page renders for a bad URL

---

## Propagation

Cloudflare's edge updates in seconds. Resolvers elsewhere honour the TTL, so
allow up to an hour for full propagation and do not panic if one network still
shows the old answer.

Raise TTL from 300s to 3600s once you are confident — a week is a reasonable
wait.
