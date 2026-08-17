# Command reference

Every command needed to deploy, verify and roll back, in one place.

**This is a terminal cheat-sheet, not a procedure.** For the *why*, the ordering
and the decision points, use the linked documents — this page assumes you have
already read them and are now at a prompt.

| Need | Read |
|---|---|
| Full deployment procedure | [PRODUCTION-DEPLOYMENT](./PRODUCTION-DEPLOYMENT.md) |
| Timed launch sequence | [LAUNCH-DAY-RUNBOOK](./LAUNCH-DAY-RUNBOOK.md) |
| Worker audit + gate | [WORKER-DEPLOYMENT-CHECKLIST](./WORKER-DEPLOYMENT-CHECKLIST.md) |
| DNS and TLS detail | [DNS-VERIFICATION](./DNS-VERIFICATION.md) |
| Email setup | [EMAIL-SETUP](./EMAIL-SETUP.md) |

---

## 0 · Session setup

Paste once per terminal session. Everything below assumes these are set.

```bash
export SITE="navadisha.bikashkadayat.com.np"
export ORIGIN="https://$SITE"
export ENDPOINT="$ORIGIN/api/contact"       # or the workers.dev URL until routed
export REPO_DIR="/home/dell/Desktop/NAVADISHA"

cd "$REPO_DIR"
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22
```

Node 22 is required — Vite 8 rejects anything below 20.19.

---

## 1 · Cloudflare Worker

### Deploy

```bash
cd "$REPO_DIR/worker"

npx wrangler login
npx wrangler whoami                          # confirm the right account

npx wrangler kv namespace create LEADS       # → paste the id into wrangler.toml
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put TURNSTILE_SECRET     # optional
npx wrangler secret list                     # verify — values are never shown

npx wrangler deploy
```

### Verify — all six must pass

```bash
# 1 · valid submission → {"ok":true}
curl -X POST "$ENDPOINT" -H 'content-type: application/json' -H "origin: $ORIGIN" \
  -d '{"name":"Test","email":"you@example.com","audience":"other","message":"Deployment test"}'

# 2 · lead landed
npx wrangler kv key list --binding LEADS --prefix "lead:"

# 3 · honeypot → {"ok":true} and NO new key
curl -X POST "$ENDPOINT" -H 'content-type: application/json' -H "origin: $ORIGIN" \
  -d '{"name":"Bot","email":"b@x.com","audience":"other","message":"x","website":"filled"}'

# 4 · wrong origin → 403
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$ENDPOINT" \
  -H 'content-type: application/json' -H 'origin: https://example.com' \
  -d '{"name":"A","email":"a@b.co","audience":"other","message":"x"}'

# 5 · invalid payload → 400
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$ENDPOINT" \
  -H 'content-type: application/json' -H "origin: $ORIGIN" -d '{"name":"","email":"nope"}'

# 6 · rate limit → sixth call returns 429
for i in $(seq 1 6); do
  curl -s -o /dev/null -w "%{http_code} " -X POST "$ENDPOINT" \
    -H 'content-type: application/json' -H "origin: $ORIGIN" \
    -d '{"name":"T","email":"t@e.co","audience":"other","message":"rate"}'
done; echo
```

### Operate

```bash
npx wrangler tail                                  # live request logs
npx wrangler deployments list
npx wrangler kv key list --binding LEADS --prefix "lead:"
npx wrangler kv key get  --binding LEADS "lead:<timestamp>:<uuid>"
```

> ⚠️ **Never run `wrangler kv namespace delete`, and never bulk-delete `lead:`
> keys.** That store is the enquiry history and the Phase-2 CRM's seed data.
> There is no undo. Redeploys and rollbacks do not touch it; only an explicit
> delete does.

---

## 2 · GitHub Pages

### Deploy

```bash
cd "$REPO_DIR"
nvm use
npm run build                # build + validation — run this BEFORE pushing
git status
git add -A
git commit -m "Describe the change"
git push origin main         # Actions builds, validates and deploys
```

`npm run build` runs `astro build` **and** `scripts/validate.mjs`. A validation
failure exits non-zero and fails the deploy, so a broken link or over-length
meta description never reaches production.

Expected: `24 page(s) built` then `✔ All checks passed`.

### One-time settings — dashboard, not CLI

```
Settings → Pages → Source: GitHub Actions        (not "Deploy from a branch")
Settings → Pages → Custom domain: navadisha.bikashkadayat.com.np
Settings → Secrets and variables → Actions → Variables:
    SITE_URL                   https://navadisha.bikashkadayat.com.np
    PUBLIC_FORM_ENDPOINT       <worker URL>
    PUBLIC_TURNSTILE_SITE_KEY  <optional>
```

> `PUBLIC_FORM_ENDPOINT` is compiled into the bundle at build time. **Setting it
> requires a rebuild** — re-run the workflow after changing it.

### Verify the build output locally

```bash
cat dist/CNAME                                        # navadisha.bikashkadayat.com.np
ls -la dist/.nojekyll                                 # 0 bytes, present
find dist -name '*.html' | wc -l                      # 24
grep -o '<loc>' dist/sitemap-0.xml | wc -l            # 23
grep -rho 'rel="canonical" href="[^"]*"' dist --include=*.html | grep -c "$SITE"   # 24
npm run validate                                      # re-run checks alone
```

---

## 3 · DNS and TLS

```bash
dig $SITE +short
dig $SITE +short @1.1.1.1
dig $SITE +short @8.8.8.8

curl -s -o /dev/null -w "https   %{http_code}\n"            "https://$SITE"
curl -s -o /dev/null -w "http    %{http_code} → %{redirect_url}\n" "http://$SITE"
curl -s -o /dev/null -w "404     %{http_code}\n"            "https://$SITE/nonexistent/"
curl -s -o /dev/null -w "noslash %{http_code} → %{redirect_url}\n" "https://$SITE/about"

curl -sI "https://$SITE" | grep -iE 'server|cf-ray|cf-cache-status|content-encoding|strict-transport'

echo | openssl s_client -connect $SITE:443 -servername $SITE 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

**Expected:** Cloudflare IPs · https 200 · http 301 in one hop · 404 on a bad
path · `/about` → `/about/` · `server: cloudflare` · `content-encoding: br`.

> If TLS fails: the proxy is enabled, which blocks GitHub's domain validation.
> Run the [certificate recovery sequence](./DNS-VERIFICATION.md#certificate-recovery).

---

## 4 · Email

```bash
dig navadisha.com.np MX +short
dig navadisha.com.np TXT +short | grep spf1                 # EXACTLY ONE
dig selector._domainkey.navadisha.com.np TXT +short
dig _dmarc.navadisha.com.np TXT +short
```

End-to-end, after the Worker is live:

```bash
curl -X POST "$ENDPOINT" -H 'content-type: application/json' -H "origin: $ORIGIN" \
  -d '{"name":"Email Test","email":"you@example.com","audience":"other","message":"End-to-end"}'
```

Then confirm **three** things: notification at `contact@navadisha.com.np`,
acknowledgement at the sender address, and the lead in KV. Check spam — a new
sending domain has no reputation.

---

## 5 · Full pre-launch sweep

```bash
cd "$REPO_DIR" && nvm use && npm run build || echo "BUILD FAILED — stop"

echo "── build ──"
echo "  pages:      $(find dist -name '*.html' | wc -l)   (expect 24)"
echo "  sitemap:    $(grep -o '<loc>' dist/sitemap-0.xml | wc -l)   (expect 23)"
echo "  canonicals: $(grep -rho 'rel=\"canonical\"' dist --include=*.html | wc -l)   (expect 24)"
echo "  CNAME:      $(cat dist/CNAME)"
echo "  nojekyll:   $([ -f dist/.nojekyll ] && echo present || echo MISSING)"

echo "── live ──"
curl -s -o /dev/null -w "  https  %{http_code}\n" "https://$SITE"
curl -s -o /dev/null -w "  404    %{http_code}\n" "https://$SITE/nonexistent/"
curl -s "https://$SITE/robots.txt" | head -4

echo "── worker ──"
curl -s -o /dev/null -w "  empty body → %{http_code} (expect 400)\n" \
  -X POST "$ENDPOINT" -H 'content-type: application/json' -d '{}'

echo "── third-party requests (expect only the site + wa.me) ──"
grep -rhoE '(src|href)="https?://[^"]*"' dist --include=*.html \
  | sed 's|.*="\(https\?://[^/]*\).*|\1|' | sort -u | sed 's/^/  /'
```

---

## 6 · Rollback

### Bad deploy — fastest first

```bash
# No git operation needed — ~2 min
# GitHub → Actions → last known-good run → "Re-run all jobs"

# Or revert
git revert HEAD && git push origin main

# Or revert several
git revert --no-commit HEAD~3..HEAD && git commit -m "Revert to <sha>" && git push origin main
```

### Worker

```bash
cd "$REPO_DIR/worker"
npx wrangler deployments list
npx wrangler rollback                 # previous version — KV untouched
npx wrangler tail                     # watch what is actually failing
```

### Cloudflare

```
Certificate failing   → set DNS record to DNS-only (grey cloud)
Redirect loop         → SSL/TLS → Full (strict)
Unstyled / dead nav   → Rocket Loader OFF, Auto Minify OFF, then purge
Stale content         → purge the URL
```

```bash
# purge one URL — preferred
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" \
  --data "{\"files\":[\"https://$SITE/about/team/\"]}"

# verify — MISS or EXPIRED is correct right after a purge
curl -sI "https://$SITE/about/team/" | grep -i cf-cache-status
```

### Full stop

```
1  Cloudflare → delete the DNS record          (TTL 300s)
2  GitHub → Pages → remove the custom domain
3  Site remains at bikashkadayat.github.io/Navadisha-/ for your own testing
4  LEAVE the Worker deployed — costs nothing, preserves captured leads
5  DO NOT touch KV
```

### Two rules

1. **Change one thing at a time.** Three simultaneous changes and you cannot
   tell which fixed it — or which caused it.
2. **Write down every change as you make it.**

---

## 7 · Diagnostics

| Symptom | First command |
|---|---|
| Site down | `curl -sI "https://$SITE"` |
| TLS error | `echo \| openssl s_client -connect $SITE:443 -servername $SITE` |
| Wrong content | `curl -sI "https://$SITE/" \| grep -i cf-cache-status` |
| Form broken | `npx wrangler kv key list --binding LEADS --prefix "lead:"` |
| Form 403 | `grep ALLOWED_ORIGIN worker/wrangler.toml` |
| No emails | `npx wrangler tail` then submit |
| Deploy failed | Actions log — validation names the file and the rule |

**Form diagnosis is a two-way branch.** Lead present in KV → the form and Worker
are fine and the *email path* is broken; no data lost. Lead absent → the Worker
is not receiving; enquiries are being lost.
