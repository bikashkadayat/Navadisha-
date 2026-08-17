---
title: A bilingual pricing and pickup platform for KTM Kawadi
client: KTM Kawadi
anonymised: false
illustrative: false
sector: business
pillars:
  - technology
date: 2026-06-28
challenge: >-
  Scrap buying in Kathmandu runs on a trust deficit: sellers cannot check a rate
  before a buyer arrives, cannot verify the weighing, and have no way to
  estimate what a load is worth. KTM Kawadi wanted to compete on transparency
  rather than on being the nearest kawadi — which meant the rates had to be
  public and checkable before anyone picked up the phone.
approach: >-
  We built the price list into the product rather than treating it as content.
  A published rate table covers the material categories the business buys, and
  an interactive calculator lets a seller estimate a load's value before
  booking. The site is bilingual English and Nepali with proper hreflang
  handling, carries a dark theme, and puts phone, WhatsApp and booking within
  reach on every screen.
outcomes:
  - metric: Public platform
    value: Launched
  - metric: Languages
    value: English and Nepali
  - metric: Scrap value calculator
    value: Live
  - metric: Material categories priced
    value: '10'
metricsPending: true
impact: >-
  A seller can now check a rate, estimate what a load is worth and book a pickup
  without speaking to anyone first. For a trade where the price has traditionally
  been disclosed only once the buyer is standing in your yard, publishing the
  rate table is the substantive change — the calculator simply makes it usable.
lessons:
  - title: Publishing the price was the product decision, not a content one
    body: >-
      The instinct in this trade is to keep rates negotiable. Committing to a
      public rate table is a commercial decision with real consequences, and the
      whole site depends on it. The calculator is only useful because the
      underlying numbers are public and maintained.
  - title: Bilingual has to be structural or it decays
    body: >-
      Nepali and English are handled as parallel routes with hreflang rather
      than as a translation widget bolted on. Anything less and the second
      language quietly falls out of date the first time a rate changes.
  - title: The rate table is now an operational dependency
    body: >-
      A published price is a promise. It has to be updated when the market
      moves, and that is an ongoing obligation we created for the client. We
      should have been more explicit at handover about who owns that update and
      how often it needs doing.
  - title: No performance data was agreed
    body: >-
      Booking volumes, calculator usage and the split between the two languages
      would all be worth knowing and none of it was instrumented. We can
      describe what the platform does and not what it has achieved.
servicesApplied:
  - web-development
featured: true
seo:
  title: KTM Kawadi — bilingual scrap pricing and pickup platform
  description: A published rate table, a scrap value calculator and bilingual English–Nepali routing, built to compete on transparency in Kathmandu's scrap trade.
draft: false
---

## The problem was price opacity

Kathmandu's kawadi trade has a structural trust problem. A seller calling a
scrap buyer has no way to know the going rate, no way to verify the weighing,
and no way to estimate what a load is worth before the buyer is already at the
door. The negotiation happens at the point of maximum disadvantage.

KTM Kawadi's proposition is the opposite of that: transparent rates, weighing
in front of the customer, cash on the spot. The website's job was to make the
first of those checkable before any contact.

## What we built

**A public rate table.** Rates are published across the categories the business
buys: metals, wires and cables, paper, plastic, glass, batteries, electronics
and appliances, computer and IT equipment, mobile and small electronics, and
general e-waste.

**A scrap value calculator.** Sellers estimate a load's worth before booking.
This is the piece that turns a price list into something usable — most people
do not know what their scrap weighs in categories, and the calculator does that
translation.

**Bilingual English and Nepali**, implemented as parallel routes with `hreflang`
and an `x-default`, not as a client-side translation layer.

**Contact where the decision happens.** Phone, WhatsApp and pickup booking are
reachable from any point in the page, because this is a trade where people
convert on a phone call.

A dark theme is available throughout.

## The trade-off we made explicit

Publishing rates removes the buyer's negotiating advantage. That is the point,
and it is also a real commercial cost — the client accepted it deliberately.
It also creates an ongoing obligation: a published rate that is out of date is
worse than no published rate, because it is a broken promise rather than a gap.

## What is not on this page

No booking volumes, no traffic, no conversion data. None of it was instrumented
before launch and none has been shared with us since.
