# Content authoring guide

Every collection here is a **Phase-2 Django model**. Schemas live in
`src/content.config.ts`; the mapping is in the Phase-0 doc §5.5. Adding a field
here means adding it to the Django model too — that 1:1 correspondence is the
reason the migration is a data-source swap rather than a rewrite.

## The three rules that make the "no redesign" promise hold

1. **Components read from collections.** Never hard-code content in markup.
2. **Component props are data objects**, not loose strings.
3. **URLs are permanent.** `/insights/` never becomes `/blog/`.

## Editorial standard (Phase-0 doc §10)

- **Problem before offering.** Every service page opens with the reader's
  problem in the reader's language. Never lead with what we sell.
- **Specific over superlative.** A number beats an adjective every time.
- **Say the trade-off.** Naming what an approach costs builds more trust than
  claiming it solves everything. This is the voice differentiator.
- **Paragraphs: 2–4 sentences.** Headings carry meaning when read alone.
- **Never fabricate.** No invented clients, metrics, testimonials or logos. In
  Kathmandu's institutional market everyone knows everyone, and one discoverable
  invention invalidates every other trust signal on the site.

## Collections

| Directory | What goes in it | Blocker |
|---|---|---|
| `services/` | 13 service pages, 700–1,100 words each | #5 |
| `programs/` | 5 programmes: syllabus, **named trainers**, cohort dates, fees | #9 |
| `work/` | Case studies, 600–900 words, **at least one number each** | #4 |
| `insights/` | Articles, 1,200–2,000 words | #5 |
| `team/` | One file per person. Photo mandatory. | #3 |
| `testimonials/` | Attributed only — the schema will not accept otherwise | #4 |
| `partners/` | Real current relationships, `relationship` labelled | #4 |
| `positions/` | Open roles | — |

## Three schema rules that enforce honesty at build time

These are not conventions you can forget. The build rejects violations.

**`testimonials.consentOnFile` is `z.literal(true)`.** A testimonial without
written permission cannot be authored at all. There is also no field for an
unattributed quote — "— Principal, a leading college" reads as fabricated even
when it is true, so the schema makes it unwriteable.

**`work.illustrative`** marks a *Method Applied* piece — the framework shown on
a hypothetical scenario while real case studies are still landing. Templates
render a visible label for these, and they do **not** count toward the homepage
proof threshold. Never quietly present an illustrative piece as delivered work.

**`services.crossPillar.rationale`** is required whenever a cross-pillar link
exists. It must be a real connective sentence explaining *why* the two services
belong together — never "you may also like". This is the mechanism that turns
the integration story into revenue (§6.3).

## Homepage sections that remove themselves

Implemented in `src/pages/index.astro`, not left as prose:

- **S5 Proof** falls back to method cards until **three real featured case
  studies** exist. `illustrative: true` does not satisfy the threshold.
- **S8 Voices** omits itself entirely when no consented testimonial exists. A
  placeholder testimonial block is worse than no section.
- **S9 Insight** omits itself when nothing is published.

Set the real content and the sections appear. Nothing to remember at launch.

## Current status

`services/` holds three **scaffold-grade** examples that prove the template and
the cross-pillar mechanism. Their copy follows the approved voice but needs
client sign-off. Ten remain. Every other collection is empty by design — see
the intake pack for what is needed to fill them.
