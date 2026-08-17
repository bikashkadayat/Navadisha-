# Operations

How to change the site after launch, without breaking it.

**Everything here is a content edit.** No component, style or template change is
required for any of these tasks — that was the point of building it this way.

---

## The loop

```bash
nvm use                       # Node 22 — pinned in .nvmrc
git switch -c content/what-you-are-changing
# edit files under src/content/ or src/data/
npm run build                 # build + validation, locally
git commit -am "Describe the change"
git push -u origin content/what-you-are-changing
# open a PR, merge → Actions deploys
```

**Always run `npm run build` before pushing.** It runs the same validation CI
does. Catching a failure locally takes seconds; catching it in CI takes minutes.

Then purge the changed URLs — see [DEPLOYMENT](./DEPLOYMENT.md#cache-purge).

---

## Rules that the build enforces

`npm run build` fails on any of these. They are not style guidance.

| Rule | Limit |
|---|---|
| Meta title | ≤ 60 characters |
| Meta description | ≤ 155 characters |
| Internal links | Must resolve to a built page |
| HTML comments | Zero in output — use `{/* */}` in `.astro`, and note that Markdown `<!-- -->` comments are stripped at build |
| Headings | Exactly one `h1` per page, no level skips |
| Images | Every `<img>` needs `alt` |
| Forbidden phrases | "trusted by", client counts, "award-winning", "world-class", unverifiable guarantees |

The forbidden-phrase list is in `scripts/validate.mjs`. It is negation-aware —
*"we do not guarantee enrolment"* passes, because the page is honouring the rule
rather than breaking it.

---

## Update page copy

| Where | File |
|---|---|
| Homepage | `src/pages/index.astro` |
| Institutions, students, about, contact | `src/pages/**/index.astro` |
| Service pages | `src/content/services/*.md` |
| Company details, phone, address | `src/data/company.ts` |

Copy in `.astro` pages sits in plain markup or in a `const` array at the top.
Editing text does not touch structure.

**When registration completes:** open `src/data/company.ts`, fill in
`registration`, set `verified: true`, and flip `REGISTRATION_STATUS` to
`'registered'`. The footer compliance block, the `LocalBusiness` JSON-LD and the
About/Company table all switch on together. One edit.

---

## Update programmes

`src/data/programs.ts` is the single source. The mega menu, homepage, programmes
index and sitemap all read from it.

```ts
export const programLines: ProgramLine[] = [
  {
    title: 'AI for Students',
    status: 'planned',
    href: '/programs/ai-for-students/',
    detail: 'One day · school and college students · on-site or hybrid',
    timing: 'Tentatively October 2026',
  },
  { title: 'Networking Training', status: 'in-development' },
];
```

### The status taxonomy is load-bearing

| Status | Meaning | Renders |
|---|---|---|
| `running` | Delivered at least once | Full detail page, linked |
| `planned` | Defined, trainer named, not yet delivered | Detail page, status visible |
| `in-development` | A named intention only | Listed with a status, **no link** |

`in-development` entries have no `href` **deliberately** — there is nothing
behind them and a link implies there is. `isLinkable()` enforces it; the
templates cannot accidentally link one.

### When the workshop runs

1. Change `status` to `'running'`
2. Add real cohort dates in `src/content/programs/ai-for-students.md`
3. **Only now** add a syllabus, fee or certification

> A published syllabus is a delivery commitment. Publishing one before the
> workshop is designed means either constraining the design or breaking the
> commitment. `ProgramStatusBlock` has no props for syllabus, fee or
> certification — the constraint is in the type signature, not in memory.

---

## Add a case study

Create `src/content/work/<slug>.md`:

```yaml
---
title: What was delivered, in plain words
client: Organisation name          # or a described type if anonymised
anonymised: false
illustrative: false                # true = "Method Applied", NOT a real engagement
sector: development                # school | college | development | business | …
pillars: [technology]              # two entries → "Education + Technology" badge
date: 2026-09-15
challenge: >-
  What was actually wrong, in the client's terms.
approach: >-
  What we did about it.
outcomes:
  - metric: What was measured
    value: The number
metricsPending: false              # true renders a visible "no metric yet" note
impact: >-
  What changed for the organisation. Verified, not speculative.
lessons:
  - title: Include at least one thing you would do differently
    body: >-
      A portfolio of unbroken successes reads as marketing.
servicesApplied: [web-development]
featured: true
seo:
  title: ≤ 60 characters
  description: ≤ 155 characters
draft: false
---

Body copy in Markdown.
```

**At three featured case studies**, the homepage and Work index switch from the
single-case editorial band to a card grid **automatically**. No code change.

### Rules

- **Never invent a metric.** Set `metricsPending: true` and the page states the
  gap honestly instead.
- **`illustrative: true`** marks a Method Applied piece. Templates label it, and
  it does not count toward the three-case threshold.
- **`lessons` must include a genuine failure.** It is the one place a case study
  may contain something other than verified client fact, because it is
  explicitly our own view of our own work.

---

## Add an article

`/insights/` templates are **not yet built** — the section was deferred because
publishing an empty index is worse than having none.

To launch it:

1. Write three articles as `src/content/insights/<slug>.md` — the collection
   schema already exists in `src/content.config.ts`
2. Build `src/pages/insights/index.astro` and `[...slug].astro`
3. Restore `{ label: 'Insights', href: '/insights/' }` to `primaryNav` in
   `src/data/nav.ts`
4. Restore the Insights links in `footerColumns`

**Three articles is the threshold, not one.** The same rule that removed it in
the first place.

> `/insights/` is the permanent URL. It must never become `/blog/` — the
> Phase-2 blog inherits this URL space and its accumulated authority.

---

## Promote Programs into the top navigation

Programs currently lives inside the Services mega menu. The restore condition is
encoded, not remembered:

```ts
// src/data/programs.ts
export function programsEarnTopLevel(): boolean {
  return programLines.filter((p) => p.status === 'running').length >= 2;
}
```

**Two programmes must be at `running` status** — delivered, with confirmed
dates. Not written up. Delivered.

When that is true:

1. Add `{ label: 'Programs', href: '/programs/' }` to `primaryNav` in
   `src/data/nav.ts`, between `Services` and `Work`
2. Optionally remove the Programmes block from the mega menu — or keep it; it is
   useful either way
3. Rebuild

> **Six top-level items is the permanent ceiling.** Adding Programs while
> Insights is also present puts the bar at seven. At that point move `Work`
> inside the Services mega menu — once there are eight case studies they belong
> grouped under the services they evidence, not in a flat index. Work is
> top-level now only because there is one, and it needs the shortest route.

---

## Add a testimonial

```yaml
---
quote: What they said
authorName: Full name
authorRole: Their role
organisation: Their organisation
consentOnFile: true        # must be literally true — schema rejects anything else
featured: true
---
```

The homepage Voices section appears automatically once one exists.

**There is no field for an unattributed quote.** *"— Principal, a leading
college"* reads as fabricated even when it is completely true, so the schema
makes it unwriteable.

`consentOnFile` is `z.literal(true)`: a testimonial without written permission
cannot be authored at all.

---

## Add a partner logo

```yaml
---
name: Organisation
relationship: client       # client | delivery-partner | network | accreditation
logo: /partners/name.svg
current: true
consentOnFile: true
---
```

`relationship` is **required**. A logo strip that implies client relationships
which do not exist is the most damaging and most easily caught form of website
dishonesty.

---

## Update the team

`src/content/team/<slug>.md`. Set `photo` to a path in `public/` and the
initials fallback upgrades itself — no template change.

---

## Reading contact form leads

Until the Phase-2 CRM exists, KV is the record:

```bash
cd worker
npx wrangler kv key list --binding LEADS --prefix "lead:"
npx wrangler kv key get --binding LEADS "lead:2026-08-17T09:14:22.104Z:uuid"
```

Keys are ISO-timestamp prefixed, so they list chronologically.

**Check weekly.** A lead present in KV with no corresponding email means the
email path is broken — and that failure is invisible from the outside, because
the visitor saw a success message.

> ⚠️ **Never delete this namespace or bulk-delete `lead:` keys.** It is the
> enquiry history and the CRM's seed data. There is no undo.

---

## Adding analytics later

The privacy policy currently states, accurately, that the site sets no cookies
and runs no analytics.

If you add Cloudflare Web Analytics — cookieless, so the claim mostly survives —
**edit `src/pages/privacy/index.astro` in the same commit**. The policy names
what is in use; leaving it stale would make it false.

The policy already anticipates this:

> *"If we add privacy-respecting analytics later … this page will be updated
> before it goes live, and it will be named here."*
