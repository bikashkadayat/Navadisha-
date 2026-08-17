# Technical Requirements — Logo Redraw

**Client:** NAVADISHA Consulting & Innovations Pvt. Ltd.
**Deliverable:** Complete SVG-first logo asset system
**Status:** Approved — ready to brief a designer
**Date:** 16 August 2026

---

## 1. Purpose

Navadisha's current logo exists only as raster PNG. This creates three hard
limits that block professional use:

1. **No dark-background asset.** The better (flat) version exists only as a crop
   from a marketing banner, on a light background. It cannot be placed on the
   navy sections that carry the site's hero and conversion blocks.
2. **Illegible at small sizes.** The 3D version collapses into an indistinct
   blue shape at 64px, and is unreadable at 32px — the favicon size, which is
   the size buyers see most often.
3. **No monochrome.** Single-colour reproduction is required for stamps,
   letterhead, embroidery, fax-grade documents, tender submissions and
   partner co-branding. None currently exists.

This document specifies the redraw.

---

## 2. Source of truth

> **Use the FLAT logo variant as the sole reference.**
> **Do NOT use the 3D version for anything.**

| File | Role |
|---|---|
| `brand/flat-lockup-REFERENCE.png` | Primary reference — full horizontal lockup |
| `brand/flat-mark-REFERENCE.png` | Primary reference — icon only |
| `brand/source/asset-3.png` | Original context (banner the flat lockup was extracted from) |
| `brand/source/asset-1.png`, `asset-2.png`, `asset-4.png` | ⛔ 3D versions — reference only for motif inventory, never for style |

The flat version is the approved design language. The redraw reproduces its
forms as clean vector geometry — it is a **redraw, not a redesign**. Proportion,
motif and character must be recognisably preserved.

---

## 3. Prohibited treatments

Non-negotiable. Any deliverable containing these is rejected.

- ❌ Bevels
- ❌ Drop shadows or inner shadows
- ❌ Gloss, sheen or specular highlights
- ❌ 3D extrusion, perspective or isometric styling
- ❌ Raster effects of any kind embedded in the SVG
- ❌ Gradients used to simulate dimension

Flat gradients are permitted **only** where the flat reference already uses one,
and only as a two-stop flat colour transition. When in doubt: solid fill.

**Standard:** premium consulting-firm identity. The benchmark is a mark that
would sit unremarkably on a tender document beside an international firm's.

---

## 4. Motif inventory — what must survive the redraw

The mark carries five elements. All are meaningful; none are decorative.

| Element | Meaning | Must survive |
|---|---|---|
| **Compass ring + cardinal points** | *Disha* — direction. The literal brand name. | ✅ Yes |
| **Letter N** | Navadisha monogram | ✅ Yes |
| **Bridge** | **The core positioning.** See §5. | ✅ Yes — critical |
| **Road / path** | Journey, progression, the route taken | ✅ Yes |
| **Upward arrow** | Growth, advancement | ✅ Yes |

At the Compact and Icon sizes some elements must simplify. Priority order when
detail must be dropped: **Bridge → N → Compass → Arrow → Road.**

---

## 5. Why the bridge is protected

Navadisha's approved positioning is that the firm is a **bridge** between
Education, Technology, Innovation, Industry and Opportunity.

The existing mark already contains a bridge. The identity and the strategy agree
without anyone having planned it, which is rare and valuable.

**The bridge is therefore the single most important element in the mark.** It
must remain legible at Compact size and, if at all possible, at Icon size. A
redraw that simplifies the bridge away — however cleaner the result — fails this
specification.

---

## 6. Required assets

Six variants. Each in SVG (primary) plus exported PNG at the listed sizes.

### 6.1 Full Logo
Mark + "NAVADISHA" + "Consulting & Innovations Pvt. Ltd." descriptor, stacked or
as per the flat reference.
- **Use:** letterhead, proposals, capability statements, tender covers
- **Min width:** 180px / 45mm
- **PNG exports:** 1×, 2×, 3× at 600px, 1200px, 1800px wide

### 6.2 Horizontal Logo
Mark left, wordmark right. The primary web and email-signature lockup.
- **Use:** website header, email signature, presentation headers
- **Min width:** 140px / 35mm
- **PNG exports:** 280px, 560px, 840px wide

### 6.3 Compact Logo
Mark + "NAVADISHA" wordmark only, no descriptor.
- **Use:** mobile header, social profile headers, narrow placements
- **Min width:** 96px / 24mm
- **PNG exports:** 192px, 384px wide

### 6.4 Icon Only
Mark alone, no type. **Must be optically balanced within a square.**
- **Use:** favicon, app icon, social avatar, watermark
- **Must remain legible at 32px** — this is the acceptance test that the current
  logo fails
- **PNG exports:** 512, 256, 192, 180, 96, 64, 48, 32, 16
- **Also supply:** `favicon.svg`, and a version safely inset for circular crops
  (social avatars crop to a circle — the mark must not clip)

### 6.5 Black Monochrome
Single colour, pure black `#000000`. Full/Horizontal/Compact/Icon.
- **Use:** fax, photocopy, single-colour print, engraving, official stamps
- Must read correctly with **no** colour information — relationships currently
  carried by blue-vs-orange must be carried by shape, weight or negative space

### 6.6 White Monochrome
Single colour, pure white `#FFFFFF`. Full/Horizontal/Compact/Icon.
- **Use:** navy and photographic backgrounds, dark mode, merchandise
- Must hold against the brand navy `#0F172A` and the primary `#0A4D8C`

---

## 7. Colour

Brand colours are approved and unchanged. Reproduce exactly.

| Role | HEX | RGB | Notes |
|---|---|---|---|
| Primary — Navadisha Blue | `#0A4D8C` | 10, 77, 140 | Mark, wordmark |
| Secondary — Navadisha Orange | `#F57C00` | 245, 124, 0 | Arrow, accents |
| Dark | `#0F172A` | 15, 23, 42 | Backgrounds |
| Light | `#F8FAFC` | 248, 250, 252 | Backgrounds |

Supply CMYK and Pantone equivalents for print alongside the delivery.

> **Note for the designer, not a change request:** these brand colours are used
> at full strength in the logo, icons, illustrations, buttons and accent
> graphics. The *website* additionally uses darkened derivatives for body text
> only, because `#F57C00` and `#00A6A6` do not meet WCAG contrast minimums as
> text on light backgrounds. **This does not affect the logo.** The logo uses
> the original colours throughout.

---

## 8. Technical requirements

### SVG
- Optimised, human-readable, SVGO-processed
- **All text converted to outlines** — no font dependencies
- `viewBox` present; no fixed `width`/`height` attributes
- No embedded raster images, no `<filter>` elements, no external references
- Layers/groups named meaningfully (`mark`, `wordmark`, `descriptor`)
- `fill="currentColor"` on the monochrome variants so they inherit CSS colour
- Target: **under 12KB** per file, ideally under 6KB

### Clear space
Minimum clear space on all sides equal to the height of the "N" in the wordmark
(or, for Icon Only, 15% of the mark's width). Specify in the delivered guide.

### File naming
```
navadisha-full.svg              navadisha-full-black.svg
navadisha-horizontal.svg        navadisha-full-white.svg
navadisha-compact.svg           navadisha-horizontal-black.svg
navadisha-icon.svg              navadisha-horizontal-white.svg
favicon.svg                     …etc for compact and icon
```

---

## 9. Descriptor variants — required

Company registration is in progress. Supply **two** versions of the Full and
Horizontal lockups, differing only in the descriptor text layer:

| Variant | Descriptor |
|---|---|
| **A** | `Consulting & Innovations Pvt. Ltd.` |
| **B** | `Consulting & Innovations` |

Same geometry, same spacing, one text layer different. Costs the designer
minutes now; costs a re-engagement later.

The current artwork also carries a **™** symbol. Confirm with the client whether
it should be retained, and at which lockup sizes it remains legible — below
Compact it will not reproduce cleanly and should be omitted.

---

## 10. Acceptance criteria

A deliverable is accepted when all of the following pass:

- [ ] All six variants supplied as SVG, each with the PNG exports listed
- [ ] Icon Only is **legible at 32px** — motifs distinguishable, not a blob
- [ ] Bridge motif survives at Compact size
- [ ] Black and White monochrome read correctly with zero colour information
- [ ] White variant holds against `#0F172A` and `#0A4D8C`
- [ ] Zero bevels, shadows, gloss, 3D or raster effects in any file
- [ ] All text outlined; no font dependency
- [ ] Each SVG under 12KB
- [ ] Both descriptor variants (A and B) supplied
- [ ] Circular-crop-safe icon version supplied
- [ ] Clear-space and minimum-size rules documented
- [ ] CMYK and Pantone equivalents supplied
- [ ] Editable source file delivered (`.ai` / `.afdesign` / `.svg` master)

---

## 11. Handover

Full ownership and source files transfer to Navadisha on completion. No
retainer, no licence restriction, no vendor lock-in on the identity.

Delivered into `public/brand/` for web assets and `brand/` for source and print
masters.
