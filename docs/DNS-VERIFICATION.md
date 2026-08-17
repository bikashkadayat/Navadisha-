# DNS verification

**Host:** `navadisha.bikashkadayat.com.np`
**Record:** CNAME `navadisha` → `bikashkadayat.github.io`, **proxied**
**Zone:** `bikashkadayat.com.np` on Cloudflare

---

## ⚠️ Read this before running anything

**Your proxy is already enabled.** GitHub cannot complete domain validation
through a Cloudflare proxy — it cannot see the challenge.

If GitHub has **not yet issued** its certificate for this hostname, you will see
TLS errors that do not obviously point at the cause, and no amount of Cloudflare
tweaking will fix them.

**Check this first:**

> GitHub → Settings → Pages → does the custom domain show **"Certificate
> issued"**?

- **Yes** → proceed with the checks below.
- **No / pending / error** → run the [recovery sequence](#certificate-recovery)
  before anything else.

---

## 1 · DNS records

```bash
dig navadisha.bikashkadayat.com.np +short
dig navadisha.bikashkadayat.com.np CNAME +short
dig navadisha.bikashkadayat.com.np +short @1.1.1.1
dig navadisha.bikashkadayat.com.np +short @8.8.8.8
```

| Check | Expected |
|---|---|
| Resolves | Cloudflare IPs (proxied) — **not** `185.199.*` |
| Consistent across resolvers | Same answer from 1.1.1.1 and 8.8.8.8 |
| TTL | 300s during launch; raise to 3600s after a stable week |

> Seeing `185.199.108-111.153` means the record is **DNS-only**. That is correct
> *during* certificate issuance and wrong afterwards — re-enable the proxy once
> the certificate exists.

- [ ] Record resolves
- [ ] Answer consistent across public resolvers
- [ ] TTL 300s for launch

### If the record is missing or wrong

| Type | Name | Target | Proxy |
|---|---|---|---|
| CNAME | `navadisha` | `bikashkadayat.github.io` | On |

Target is the **user** GitHub Pages host, not the project path. GitHub routes
the custom domain to the correct project once it is set in repository settings.

---

## 2 · SSL / TLS

```bash
echo | openssl s_client -connect navadisha.bikashkadayat.com.np:443 \
  -servername navadisha.bikashkadayat.com.np 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

- [ ] Certificate covers the hostname
- [ ] Not expired, `notAfter` comfortably in the future
- [ ] No browser warning in a real browser, not just curl
- [ ] Cloudflare SSL/TLS mode is **Full (strict)**

### Mode reference

| Mode | Verdict |
|---|---|
| Off | ❌ No encryption |
| Flexible | ❌ **Never.** Plain HTTP to origin → infinite redirect loop with GitHub's HTTPS enforcement, and insecure regardless |
| Full | ⚠️ Encrypted but does not validate the origin certificate |
| **Full (strict)** | ✅ **Use this** |

Once proxied, visitors see Cloudflare's certificate — but the origin certificate
still matters, because Full (strict) validates it.

---

## 3 · HTTPS and redirects

```bash
curl -I https://navadisha.bikashkadayat.com.np
curl -I http://navadisha.bikashkadayat.com.np
curl -sI https://navadisha.bikashkadayat.com.np/about/ | head -1
curl -s -o /dev/null -w "%{http_code}\n" https://navadisha.bikashkadayat.com.np/nonexistent-page/
curl -sIL http://navadisha.bikashkadayat.com.np | grep -E '^HTTP|^location'
```

| Check | Expected |
|---|---|
| HTTPS root | `200` |
| HTTP root | `301` → https |
| A content page | `200` |
| A bad path | `404`, rendering the styled 404 page |
| Redirect chain | **One hop.** More than one is a misconfiguration. |

- [ ] HTTPS returns 200
- [ ] HTTP redirects to HTTPS in a single hop
- [ ] Bad paths return the real 404 page, not a bare GitHub 404
- [ ] No redirect loop

### Trailing slashes

The site is built with `trailingSlash: 'always'` and `format: 'directory'`.

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://navadisha.bikashkadayat.com.np/about
```

GitHub Pages redirects `/about` → `/about/`. Expect a 301, and confirm the
target keeps the slash. A redirect that strips it would fight the canonical tags.

- [ ] `/about` redirects to `/about/`

---

## 4 · Cloudflare proxy

```bash
curl -sI https://navadisha.bikashkadayat.com.np | grep -iE 'server|cf-ray|cf-cache-status|content-encoding'
```

| Header | Expected | Means |
|---|---|---|
| `server` | `cloudflare` | Proxy active |
| `cf-ray` | present | Request traversed Cloudflare |
| `cf-cache-status` | `HIT` / `MISS` / `DYNAMIC` | Caching active |
| `content-encoding` | `br` or `gzip` | **Compression on** — this clears the Lighthouse text-compression deduction |

- [ ] `server: cloudflare`
- [ ] `cf-ray` present
- [ ] `content-encoding: br`

### Settings that must be correct

| Setting | Value | Symptom if wrong |
|---|---|---|
| Brotli | **On** | Lighthouse deducts for text compression |
| Rocket Loader | **Off** | **Nav and form stop working** |
| Auto Minify | **Off** | Output can break |
| Email Obfuscation | **Off** | `mailto:` links rewritten, contact page breaks |
| Early Hints | On | — |

> **Rocket Loader is the highest-risk setting on this page.** It reorders script
> execution, which breaks the navigation islands and the contact form. The
> symptom — a dead menu — looks nothing like a CDN problem.

- [ ] All five confirmed in the dashboard, not assumed

---

## 5 · HSTS

```bash
curl -sI https://navadisha.bikashkadayat.com.np | grep -i strict-transport
```

Enable at **SSL/TLS → Edge Certificates → HTTP Strict Transport Security**.

> **HSTS is a commitment, not a toggle.** Once a browser sees the header it
> refuses plain HTTP for `max-age`, and you cannot clear that from the server
> side.
>
> **Start at `max-age=86400`** (one day). Confirm nothing breaks for a week,
> then raise to `31536000`.
>
> **Do not enable `preload`.** Getting onto the preload list is easy; getting
> off it takes months.

- [ ] Enabled at `max-age=86400`
- [ ] Header present in the response
- [ ] Raised to `31536000` after a stable week
- [ ] `preload` **not** enabled

---

## 6 · Full verification script

```bash
#!/usr/bin/env bash
H="navadisha.bikashkadayat.com.np"
echo "── DNS ──";        dig $H +short
echo "── HTTPS ──";      curl -s -o /dev/null -w "  %{http_code}\n" "https://$H"
echo "── HTTP→HTTPS ──"; curl -s -o /dev/null -w "  %{http_code} → %{redirect_url}\n" "http://$H"
echo "── 404 ──";        curl -s -o /dev/null -w "  %{http_code}\n" "https://$H/nonexistent/"
echo "── headers ──";    curl -sI "https://$H" | grep -iE 'server|cf-ray|content-encoding|strict-transport|x-content-type|x-frame'
echo "── cert ──";       echo | openssl s_client -connect $H:443 -servername $H 2>/dev/null | openssl x509 -noout -subject -dates
echo "── SEO ──"
curl -s "https://$H/robots.txt" | head -4
curl -s "https://$H/sitemap-index.xml" | grep -o '<loc>[^<]*'
curl -s "https://$H/" | grep -oE '<link rel="canonical"[^>]*>'
```

---

## Certificate recovery

Run this if GitHub's certificate is pending, failing, or the site shows a TLS
error.

```
1  Cloudflare → DNS → set the record to DNS-only (GREY cloud)
2  Wait ~5 minutes, confirm:  dig navadisha.bikashkadayat.com.np +short
      → should now return 185.199.x.x (GitHub), not Cloudflare
3  GitHub → Settings → Pages → check certificate status
      still pending? remove the custom domain, wait 5 min, re-add it
4  WAIT for "Certificate issued"              ← do not proceed early
5  GitHub → enable "Enforce HTTPS"
6  Cloudflare → SSL/TLS → Full (strict)       ← BEFORE re-proxying
7  Cloudflare → switch record back to proxied (ORANGE cloud)
8  Re-run the verification script above
```

**Step 6 before step 7 matters.** Re-proxying while the mode is still Flexible
produces a redirect loop on top of the problem you were fixing.

---

## Sign-off

- [ ] DNS resolves consistently across resolvers
- [ ] Certificate valid, issued, no warning
- [ ] SSL/TLS mode Full (strict)
- [ ] HTTPS 200, HTTP 301 in one hop
- [ ] Bad paths return the styled 404
- [ ] `/about` → `/about/`
- [ ] Proxy active, Brotli on
- [ ] Rocket Loader, Auto Minify, Email Obfuscation all **off**
- [ ] HSTS at `max-age=86400`
- [ ] TTL raised to 3600s after a stable week
