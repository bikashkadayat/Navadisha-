# 4 · Domain cutover plan

**Decide this before touching DNS or GitHub settings.** Every other document
depends on the answer, and changing it after launch costs redirects and a
measurable search-authority reset.

---

## The decision

Two options. You control both domains — `contact@navadisha.com.np` proves the
second is registered.

### Option A — `navadisha.bikashkadayat.com.np`

A subdomain of the founder's personal domain. Currently configured.

| | |
|---|---|
| **For** | Zero additional cost. Already configured. Works today. |
| **Against** | Every backlink and ranking signal accrues to a personal domain, not the company. A principal forwarding the link to a committee forwards one person's name. If the firm ever moves to its own domain, the accumulated authority does not follow cleanly. |

### Option B — `navadisha.com.np` <span>← recommended</span>

The company domain, which you already own.

| | |
|---|---|
| **For** | Authority accrues to the brand. Matches the email address already in use. Forwards cleanly to a committee. Costs nothing extra — you have it. |
| **Against** | One extra DNS zone to configure. That is the entire downside. |

---

## Recommendation

**Option B.** The email address is already `contact@navadisha.com.np`; a site on
a different host than its own email reads as improvised, and this is the last
moment the change is free.

I have raised this three times across the project and will not raise it again —
this document records the reasoning so the decision is made deliberately rather
than by default.

If Option A is chosen for now, **still register the redirect path**: set up
`navadisha.com.np` as a Cloudflare redirect to the subdomain, so the company
domain is at least reserved and pointing somewhere sensible.

---

## What changes with the decision

Exactly three values. Nothing else in the codebase is domain-aware.

| Location | Value |
|---|---|
| GitHub repository variable `SITE_URL` | `https://navadisha.com.np` |
| `public/CNAME` | `navadisha.com.np` |
| `worker/wrangler.toml` → `ALLOWED_ORIGIN` | `https://navadisha.com.np` |

`astro.config.mjs` reads `SITE_URL` from the environment, so it needs no edit
for CI. Change its literal default only if local builds should match.

> **`ALLOWED_ORIGIN` must match exactly** — scheme included, no trailing slash.
> A mismatch makes every form submission return 403, and the failure looks like
> a broken form rather than a configuration error.

---

## The cutover sequence — order matters

This is the part people get wrong. **GitHub cannot issue a TLS certificate for a
domain that is proxied through Cloudflare**, because it cannot complete the
validation request. Turning the proxy on too early leaves you with certificate
errors that look inexplicable.

```
1  DNS record added, GREY CLOUD (DNS-only)
        │  GitHub can now see the domain resolving to its servers
        ▼
2  GitHub Pages → Settings → Custom domain → enter the hostname
        │  GitHub runs a DNS check, then requests a Let's Encrypt certificate
        ▼
3  WAIT for "Certificate issued" (a few minutes, occasionally up to an hour)
        │  Do not proceed until GitHub shows the green tick
        ▼
4  Enable "Enforce HTTPS" in GitHub Pages settings
        │  Only available once the certificate exists
        ▼
5  Cloudflare SSL/TLS mode → Full (strict)
        │  Set this BEFORE enabling the proxy
        ▼
6  Switch the DNS record to ORANGE CLOUD (proxied)
        │  Cloudflare now serves the CDN, WAF and compression
        ▼
7  Verify HTTPS still works and the certificate is valid
```

**Never use SSL/TLS mode "Flexible."** It terminates TLS at Cloudflare and
connects to the origin over plain HTTP. Combined with GitHub's HTTPS enforcement
it produces an infinite redirect loop, and it is insecure regardless.

---

## Rollback point

Between steps 1 and 6 the change is trivially reversible — delete the DNS record
and remove the custom domain from GitHub. The site returns to
`<owner>.github.io/<repo>/`, which stays available throughout.

After step 6, rollback means reverting the DNS record and waiting out the TTL.
Keep the TTL low (300s) until you are confident. See
[#8](./08-rollback-plan.md).
