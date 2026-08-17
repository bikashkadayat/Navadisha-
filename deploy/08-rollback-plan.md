# 8 · Rollback plan

**Read this before launching, not during an incident.**

---

## Two rules

**1 · Change one thing at a time.** Most launch failures are configuration.
Changing three settings at once means you cannot tell which one fixed it — or
which one caused it.

**2 · Write down every change as you make it.** An hour into troubleshooting,
nobody remembers what they toggled. A scrap of paper is enough.

---

## What can actually break, and how bad it is

| Layer | Rollback | Time | Data loss |
|---|---|---|---|
| Site content | Revert commit, push | ~3 min | None |
| Site deployment | Re-run an earlier Actions run | ~2 min | None |
| DNS | Revert the record | TTL (300s) | None |
| Cloudflare setting | Toggle it back | Seconds | None |
| Worker | Redeploy previous version | ~2 min | **None — KV is untouched** |
| KV namespace | *No rollback* | — | **Permanent** |

**Only one row is irreversible.** Everything else is a revert. Which is why:

> ⚠️ **Never run `wrangler kv namespace delete`, and never bulk-delete `lead:`
> keys.** That store is your enquiry history and the Phase-2 CRM's seed data.
> There is no undo. A Worker redeploy does not touch it; only an explicit delete
> does.

---

## Symptom → procedure

### Certificate error / "not secure"

**Almost certainly the proxy was enabled before GitHub issued the certificate.**

1. Cloudflare → set the record back to **grey cloud**
2. Wait 5 minutes
3. GitHub → Pages → confirm certificate status
4. If still pending, remove the custom domain, wait 5 min, re-add it
5. Once "Certificate issued" → Enforce HTTPS → SSL/TLS **Full (strict)** → *then* orange cloud

### Redirect loop

SSL/TLS mode is **Flexible**. Set it to **Full (strict)**. That is the whole fix.

### Site returns 404 everywhere

1. Actions → is the latest run green?
2. Settings → Pages → source is **GitHub Actions**, not a branch?
3. `public/CNAME` matches the domain exactly — hostname only, no scheme?
4. Fallback: remove the custom domain; confirm `<owner>.github.io/<repo>/` works.
   If it does, the problem is DNS or CNAME, not the build.

### Pages render but look unstyled or broken

Usually a Cloudflare optimisation.

1. **Rocket Loader → off** (reorders scripts; breaks the nav and form islands)
2. **Auto Minify → off** (Astro already minifies)
3. Purge cache
4. Hard-reload

### Form returns 403

`ALLOWED_ORIGIN` does not match the live origin. Compare character by character
— scheme included, no trailing slash.

```bash
cd worker && npx wrangler deploy   # after correcting wrangler.toml
```

### Form appears to submit but no email arrives

**Check KV first.** This determines which half is broken.

```bash
npx wrangler kv key list --binding LEADS --prefix "lead:"
```

- **Lead present** → the form and Worker are fine; the email path is broken.
  Not urgent — no data is being lost. See [#6](./06-email-verification.md).
- **Lead absent** → the Worker is not receiving. Check the endpoint URL baked
  into the build, and the origin check.

### Form says "our message form is not live yet"

`PUBLIC_FORM_ENDPOINT` was not set at build time. Set the repository variable,
confirm it is passed in the workflow build step, re-run the workflow.

### A bad deploy shipped

```bash
git revert HEAD
git push            # Actions redeploys the previous state
```

Or, faster: **Actions → the last good run → "Re-run all jobs."** No commit
needed, roughly two minutes.

> **Validation makes this rare.** `npm run build` runs `scripts/validate.mjs`,
> and a broken link, over-length meta description, leaked comment, missing
> `h1` or forbidden content phrase **fails the build** — so it never deploys.
> The failure mode to expect is a *failed* deploy, not a bad one.

---

## Full rollback — back to no site

If something is badly wrong and you want to stop cleanly:

1. **Cloudflare** → delete the DNS record → site stops resolving (TTL 300s)
2. **GitHub** → Pages → remove the custom domain
3. The site stays reachable at `<owner>.github.io/<repo>/` for your own testing
4. **Leave the Worker deployed** — it costs nothing and preserves any leads
   already captured
5. **Do not touch KV**

Nothing is lost. The repository, the build and the Worker all survive; only
public reachability is removed.

---

## Escalation

| Problem | Where |
|---|---|
| Certificate or Pages | GitHub Pages docs → GitHub Support |
| DNS, proxy, SSL mode | Cloudflare dashboard → Support |
| Worker errors | `npx wrangler tail` — live logs |
| Email delivery | Provider dashboard → delivery logs |

`wrangler tail` is the most useful of these. It streams live Worker requests and
shows exactly what a failing submission returned.

---

## After any incident

- [ ] Write down the symptom, cause and fix, in that order
- [ ] Add it to this document if it is likely to recur
- [ ] If it was preventable by a check, add the check to `scripts/validate.mjs`

The validation suite exists because three defects shipped before it did. Every
incident is a candidate for the same treatment — a check that fails the build is
worth more than a note that someone has to remember.
