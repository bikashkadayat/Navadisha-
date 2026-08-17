# Deployment configuration audit

**Audited:** 17 August 2026 against the built output in `dist/`
**Target:** `https://navadisha.bikashkadayat.com.np`
**Result:** ✅ **All checks pass.** One improvement applied.

Every finding below was measured, not assumed.

---

## Summary

| Area | Result |
|---|---|
| `astro.config.mjs` | ✅ Pass |
| `public/CNAME` | ✅ Pass |
| `robots.txt` | ✅ Pass |
| Sitemap | ✅ Pass |
| Canonical URLs | ✅ Pass — 24/24 |
| OpenGraph URLs | ✅ Pass — 24/24 |
| Jekyll handling | ✅ Improved — `.nojekyll` added |

---

## 1 · `astro.config.mjs`

```js
site: process.env.SITE_URL ?? 'https://navadisha.bikashkadayat.com.np'
base: '/'
trailingSlash: 'always'
build: { format: 'directory', inlineStylesheets: 'auto' }
```

| Setting | Value | Assessment |
|---|---|---|
| `site` | Env-driven, falls back to the production origin | ✅ Drives canonicals, OG and sitemap. CI overrides via the `SITE_URL` variable. |
| `base` | `/` | ✅ **Correct for a custom domain.** Must not be changed to `/Navadisha-/` — that is only for a bare `github.io` project path. |
| `trailingSlash` | `always` | ✅ Consistent with `format: 'directory'`. Mismatching these produces redirect loops. |
| `format` | `directory` | ✅ Emits `/about/index.html`, served at `/about/`. |
| Sitemap filter | Excludes `/404` and `/thank-you` | ✅ A 404 must never be in a sitemap. |

**Previously fixed:** the workflow's `SITE_URL` fallback pointed at a different
host than this file. Both now resolve to the same origin, so a missing
repository variable can no longer silently build with wrong canonicals.

---

## 2 · `public/CNAME`

```
navadisha.bikashkadayat.com.np
```

- ✅ Hostname only — no scheme, no path, no trailing slash
- ✅ 31 bytes, single trailing newline
- ✅ Copied verbatim into `dist/CNAME` by the build

---

## 3 · `robots.txt`

```
User-agent: *
Allow: /

Sitemap: https://navadisha.bikashkadayat.com.np/sitemap-index.xml
```

- ✅ Source and built output identical
- ✅ Sitemap URL absolute and on the production host
- ✅ No accidental `Disallow: /`

---

## 4 · Sitemap

| Check | Result |
|---|---|
| `sitemap-index.xml` generated | ✅ |
| Points to `sitemap-0.xml` on the correct host | ✅ |
| URLs listed | **23** |
| HTML pages built | 24 |
| Difference | ✅ `/404.html` correctly excluded |
| Referenced from `robots.txt` | ✅ |

23 = 24 pages minus the 404. Exactly right.

---

## 5 · Canonical URLs

Scanned all 24 pages:

```
canonicals present  : 24/24
correct host + path : 24/24
trailing slash      : 24/24
```

Zero mismatches. Every canonical is self-referencing, absolute, on the
production host, and consistent with `trailingSlash: 'always'`.

`noindex` appears on exactly one page — `/404.html` — which is correct.

---

## 6 · OpenGraph and Twitter

All six tags present on all 24 pages:

```
og:type · og:site_name · og:title · og:description · og:url · og:image
twitter:card
```

| Check | Result |
|---|---|
| `og:url` matches `canonical` on every page | ✅ 24/24 |
| `og:image` absolute (not relative) | ✅ 24/24 |
| `og:image` target exists | ✅ `dist/og-default.jpg`, 83.7 KB |
| `twitter:card` present | ✅ 24/24 |

> **Note on an earlier false positive.** An initial scan reported `og:site_name`
> missing on all 24 pages. That was a defect in the *scan* — the regex did not
> match the underscore in the property name. Manual inspection of the raw
> markup confirms the tag is present and correct on every page. Recorded here
> because a reader running a similar check may hit the same artifact.

---

## 7 · Jekyll handling — improvement applied

**Finding:** no `.nojekyll` file existed.

Astro emits hashed assets into `_astro/`. GitHub Pages historically runs Jekyll
over published content, and **Jekyll strips directories beginning with an
underscore** — which would 404 every stylesheet and script.

This does **not** currently apply: the workflow deploys via
`actions/upload-pages-artifact` + `actions/deploy-pages`, which serves the
artifact directly without Jekyll.

**Applied anyway.** `public/.nojekyll` is an empty file and costs nothing. If
anyone ever switches Pages to branch-based deployment, its absence would break
every asset on the site with a failure mode — pages load, all styling gone —
that is easy to misdiagnose as a build problem.

- ✅ `dist/.nojekyll` present, 0 bytes

---

## 8 · CI workflow

| Check | Result |
|---|---|
| Node from `.nvmrc` | ✅ `node-version-file: .nvmrc` |
| Deterministic install | ✅ `npm ci` |
| Build runs validation | ✅ `astro build && node scripts/validate.mjs` |
| Validation failure fails the deploy | ✅ non-zero exit |
| Artifact path | ✅ `dist` |
| Concurrency guarded | ✅ `group: pages`, `cancel-in-progress: false` |
| Permissions | ✅ `pages: write`, `id-token: write` |

**One observation, not a defect:** the `astro check` step carries
`continue-on-error: true`, so type errors are reported but do not fail the
build. That was deliberate while type coverage was incomplete. Worth flipping to
`false` once you are confident — but *after* launch, not before, since it can
only add new ways for the deploy to fail on launch day.

---

## Verification commands

Reproduce this audit at any time:

```bash
npm run build

# CNAME and Jekyll
cat dist/CNAME && ls -la dist/.nojekyll

# canonicals on the correct host
grep -rho 'rel="canonical" href="[^"]*"' dist --include=*.html \
  | grep -c 'navadisha.bikashkadayat.com.np'      # expect 24

# sitemap
grep -o '<loc>' dist/sitemap-0.xml | wc -l         # expect 23

# OpenGraph coverage
for t in og:type og:site_name og:title og:description og:url og:image twitter:card; do
  printf '%-16s %s/24\n' "$t" "$(grep -rl "$t" dist --include=*.html | wc -l)"
done

# no third-party requests
grep -rhoE '(src|href)="https?://[^"]*"' dist --include=*.html \
  | sed 's|.*="\(https\?://[^/]*\).*|\1|' | sort -u
```

Expected from the last command: only `https://navadisha.bikashkadayat.com.np`
and `https://wa.me` — the latter a link target, not a resource load.

---

## Conclusion

**Deployment configuration is production-ready.** No blocking defects. The one
improvement identified — `.nojekyll` — has been applied and the build
re-verified at 24 pages with all validation passing.

Nothing in this audit required a change to UI, content or architecture.
