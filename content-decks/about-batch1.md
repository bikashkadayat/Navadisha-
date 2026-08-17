# Batch 1 — production copy

**Pages:** `/about/` · `/about/method/` · `/about/company/`
**Status:** Final, published in build
**Register:** Consulting practice. Measured, declarative, concrete.

The copy lives in the page files themselves; this deck is the editorial record —
what each page is arguing, and the rules the writing follows.

---

## Editorial rules applied

| Rule | Applied as |
|---|---|
| Problem before offering | Every section opens with the situation, not the service |
| Specific over superlative | No "leading", "world-class", "passionate", "cutting-edge" |
| Name the trade-off | Enable section states the commercial cost of capability transfer |
| State the limitation first | About names the practice as young before a reader concludes it |
| No hype vocabulary | Zero instances of "empower", "revolutionise", "seamless", "synergy" |
| No exclamation marks | Zero |
| Verified only | No metrics, testimonials, logos, partnerships or credentials beyond those approved |

---

## `/about/` — Our Story

**Argument:** Navadisha exists because education, technology and industry are
treated as separate procurement decisions when they are one connected problem.

**H1** — Navadisha means new direction. The name describes the work.

**Lede** — Nepal is not short of capable institutions or capable people. It is
short of the connections between them, and of the systems that would make those
connections work. Navadisha exists to close that distance.

**Sections**

1. **Hero** — the name explained without cleverness
2. **Our Story** — four paragraphs. The observation, why existing suppliers miss
   it, where the founders came from, and a plain statement that the practice is
   young and founder-led
3. **The Bridge** — five nodes, shared component with the homepage
4. **Two Practice Areas** — Education and Technology, co-equal
5. **What We Believe** — four positions, each a scoping principle rather than a
   value-statement platitude
6. **Why We Exist** — the cost of the gap, and who pays it
7. **CTA** — conversion band

**The four beliefs**

| # | Position | Why this and not a platitude |
|---|---|---|
| 01 | Direction before delivery | Commits to opening with the problem, in the client's language |
| 02 | Evidence before opinion | Commits to saying "we don't know" rather than filling gaps with confidence |
| 03 | Capability before dependency | Commits to handover as a defined stage |
| 04 | Rooted, held to international standards | Working in Nepal is not a reason to lower the standard |

**Deliberate line:** *"We are a young practice, founder-led, and we would rather
state that plainly than imply a scale we do not have."* A new firm with a clear
thesis outperforms an established one with none — but only if it names its
position before the reader works it out.

---

## `/about/method/` — Our Method

**Argument:** With one case study, published method is the strongest credible
proof available. Unlike a track record, it is proof a new practice can
legitimately create rather than wait for.

**H1** — Four stages. The fourth is the one that changes the outcome.

**Structure per stage** — six dimensions, not the usual three:

```
Premise            why this stage exists at all
Inputs             what the stage consumes
Activities         what is actually done
Outputs            what is produced
Expected outcome   what changes for the organisation
What you provide   ← client obligation, stated
What we provide    ← our obligation, stated
```

The last two are the ones most firms omit. Stating mutual obligation is a trust
mechanism: an engagement described as effortless for the client is being
mis-sold, and experienced buyers recognise that immediately.

**Stage durations** — Diagnose 1–3 weeks · Direct 1–3 weeks · Deliver scoped per
engagement · Enable 1–2 weeks plus a defined taper.

**Why Enable is different — the argument in full**

1. There is a *structural* reason capability transfer is rare: a supplier whose
   recurring revenue depends on client incapacity has no incentive to remove it.
   This does not require bad faith — handover simply keeps getting
   deprioritised.
2. We treat it as a scoping problem, not an ethical one. Enable is scheduled and
   resourced. Owners are identified during Direct, not located in the final week.
3. **The test, stated checkably:** before an engagement closes, a named person at
   the organisation must have *performed* the core ongoing task without
   assistance. Not observed it.
4. **The trade-off, named:** this makes some engagements shorter and forgoes
   maintenance revenue many firms rely on. We state the cost rather than
   presenting the position as costless virtue.

**Sustainability panel** — five concrete commitments: documentation for the
person who will use it; systems matched to maintainable capacity; full transfer
of files and credentials; support taper with a stated end; no proprietary
lock-in.

---

## `/about/company/` — Company & Compliance

**Argument:** Buyers with procurement or donor-compliance requirements need to
verify who they are contracting with. This page holds that information,
*including what is not yet in place*.

**H1** — Company information, stated as it currently stands.

**Sections**

1. **Current structure** — operating name, founder-led structure, Kathmandu base
2. **Registration** — the honest status, and what will appear here on completion
3. **Contact** — verified details only
4. **Working with us** — pricing, ownership, ongoing support
5. **CTA**

**The registration section — the page's reason to exist**

Registration is in progress, so the page states that plainly and then does
something more useful than an apology: it says what the status *means
operationally*.

> We are currently able to work with private institutions, businesses and
> organisations that do not require a registration certificate as a condition of
> engagement. We are **not** currently able to participate in public tenders or
> in donor-funded procurement where registration and tax clearance are a
> prerequisite. If your process requires those documents, we will tell you at the
> first conversation rather than partway through.

This converts a weakness into a demonstration of how the firm handles
inconvenient facts — which is precisely what a compliance-minded buyer is
assessing.

A side panel lists the five fields that will be published here on completion, so
a buyer assessing for a future engagement knows where to look.

**Commercial terms, stated before being asked**

| Term | Position |
|---|---|
| Pricing | Quoted on request after a first conversation. Diagnostic is fixed-fee; delivery scoped after it. |
| Ownership | Source files, accounts and credentials transfer at close. No proprietary lock-in. |
| Ongoing support | Available, structured as a defined taper rather than an open retainer. |

**Nothing fabricated.** No registration number, no PAN/VAT, no incorporation
date, and no empty labelled fields waiting to be filled. The whole section is
driven by `src/data/company.ts` — populate it and flip `REGISTRATION_STATUS`,
and the real table replaces the notice with no template change.
