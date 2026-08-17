# 3 · GitHub repository initialisation

The project directory is **not yet a git repository**. Nothing has ever been
committed. This is a first-time setup.

Roughly 20 minutes.

---

## 1 · Initialise and make the first commit

```bash
cd /home/dell/Desktop/NAVADISHA
git init -b main
```

**Before staging anything, confirm what git would include:**

```bash
git add -A --dry-run | grep -iE '\.env|node_modules|/dist/|wrangler\.toml' || echo "clean"
```

`node_modules/`, `dist/`, `.astro/` and `.env` are already excluded by
`.gitignore`. `wrangler.toml` **is** committed — it holds no secrets, only
non-sensitive vars and the KV namespace id.

> **Secrets never enter the repository.** `RESEND_API_KEY` and
> `TURNSTILE_SECRET` live in Wrangler secrets. If either ever lands in a commit,
> rotate it — removing the commit is not enough, because the value was pushed.

```bash
git add -A
git commit -m "Initial commit: Navadisha Phase-1 site

24 pages, Astro + Tailwind, self-hosted fonts, Cloudflare Worker form relay.
Build validation enforces meta length, link integrity, comment leakage,
accessibility structure and content-integrity rules."
```

## 2 · Create the remote and push

Create an **empty** repository on GitHub — no README, no .gitignore, no licence,
or the first push will conflict.

```bash
git remote add origin https://github.com/<owner>/<repo>.git
git push -u origin main
```

**Public or private?** Either works with Pages on a paid plan; free plans need
public for Pages. There is nothing sensitive in the repository, but note that
the content decks and the strategy documents in `deploy/` and `brand/` become
publicly readable if the repo is public. Consider moving `content-decks/` and
`brand/LOGO-SPEC.md` to a private location if that matters.

## 3 · Enable Pages

**Settings → Pages → Build and deployment → Source: `GitHub Actions`**

Not "Deploy from a branch". The workflow at `.github/workflows/deploy.yml`
already has the required permissions:

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

## 4 · Set the repository variable — do not skip this

**Settings → Secrets and variables → Actions → Variables → New**

| Name | Value |
|---|---|
| `SITE_URL` | `https://navadisha.com.np` *or* `https://navadisha.bikashkadayat.com.np` |

Use the domain chosen in [#4](./04-domain-cutover.md), with scheme, **no
trailing slash**.

> **Why this is mandatory.** `astro.config.mjs` falls back to the subdomain and
> the workflow falls back to the apex. They disagree. Without this variable, CI
> builds with a different host than local, and every canonical URL, Open Graph
> tag and sitemap entry in production points at the wrong domain — a silent SEO
> failure that surfaces weeks later as duplicate-content problems.

## 5 · Add the form endpoint to the build

The workflow does not currently pass `PUBLIC_FORM_ENDPOINT`, so a CI build ships
with the contact form disabled. Add the variable:

| Name | Value |
|---|---|
| `PUBLIC_FORM_ENDPOINT` | The deployed Worker URL, e.g. `https://navadisha.com.np/api/contact` |
| `PUBLIC_TURNSTILE_SITE_KEY` | *(optional)* Turnstile site key |

Then add them to the build step in `.github/workflows/deploy.yml`:

```yaml
      - name: Build
        run: npm run build
        env:
          SITE_URL: ${{ vars.SITE_URL }}
          PUBLIC_FORM_ENDPOINT: ${{ vars.PUBLIC_FORM_ENDPOINT }}
          PUBLIC_TURNSTILE_SITE_KEY: ${{ vars.PUBLIC_TURNSTILE_SITE_KEY }}
```

These are **variables, not secrets** — they are public values baked into the
client bundle. Storing them as secrets would only make them harder to read
without making them any less public.

## 6 · Create the CNAME file

GitHub Pages needs a `CNAME` file in the published output. Astro copies
everything in `public/` verbatim:

```bash
echo "navadisha.com.np" > public/CNAME   # or the subdomain, no scheme, no slash
git add public/CNAME && git commit -m "Add CNAME for custom domain" && git push
```

One line, hostname only — no `https://`, no trailing slash.

## 7 · Verify the first run

**Actions** tab → watch the run. Two things must both pass:

1. `astro build` — 24 pages
2. `node scripts/validate.mjs` — **"All checks passed"**

Validation runs as part of `npm run build`, so **a validation failure fails the
deploy**. That is intentional: a broken link or an over-length meta description
should never reach production.

If the run is green, the site is live at `https://<owner>.github.io/<repo>/`
until DNS is pointed. Check it there first — it is the cheapest possible smoke
test.

---

## Branch protection — optional, recommended once live

**Settings → Branches → Add rule** for `main`:

- Require a pull request before merging
- Require status checks to pass — select the build job

With one or two committers this can feel like ceremony. Its actual value is that
it makes it impossible to push a change that fails validation directly to the
branch that deploys.

---

## Ongoing workflow

```bash
git switch -c content/update-team-bios
# edit
npm run build          # build + validation, locally, before pushing
git commit -am "Update team bios"
git push -u origin content/update-team-bios
# open PR, merge → Actions deploys automatically
```

**Always run `npm run build` locally before pushing.** It runs the same
validation CI does, and catching a failure locally takes seconds where catching
it in CI takes minutes.
