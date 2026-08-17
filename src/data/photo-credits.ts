/**
 * IMAGE PROVENANCE
 *
 * Every photograph on this site is recorded here. Nothing ships without an
 * entry.
 *
 * THERE IS NO STOCK PHOTOGRAPHY ON THIS SITE. An earlier pass used
 * free-licence imagery from Unsplash for the hero, the pillar cards and the
 * programme band. All of it has been removed and replaced with real assets:
 * photographs from a delivered Navadisha programme, and screenshots of
 * delivered client platforms. If you are tempted to add a stock image, read the
 * rules below first — they are the reason it was taken out.
 *
 * WHY THIS FILE EXISTS, beyond attribution:
 *
 * The honesty guarantees in this build are structural — `consentOnFile` makes
 * an unconsented testimonial unwriteable, `metricsPending` forces a visible
 * "no quantified result" note, and CI rejects nine categories of unevidenced
 * claim. None of that machinery can read a photograph. A picture of a full
 * classroom on a programme page asserts "this ran" as loudly as a sentence
 * would, and no validator will catch it.
 *
 * THE RULES:
 *
 *   1. NO photograph in a proof slot unless it is a real artefact. Case studies
 *      carry screenshots of the live sites we actually built — see
 *      src/data/work-images.ts.
 *   2. NO photograph on a founder card. Initials remain the fallback. A stock
 *      portrait beside a real name is a fabricated person.
 *   3. A photograph of a DELIVERED programme must never sit on the page of a
 *      PLANNED one without a caption naming which programme it shows. This is
 *      the trap the AI for Students page is built around: its status block says
 *      in bold that the workshop has not run, and an uncaptioned session photo
 *      above it would contradict that within one screen.
 *   4. Alt text describes WHAT IS IN THE FRAME — never an outcome, a reach
 *      figure, or a relationship the page has not evidenced.
 *
 * CONSENT — OUTSTANDING, RAISE WITH THE CLIENT:
 *
 * The training photographs show identifiable people, including school-age
 * children. They were supplied by the founder for use on this site, which
 * implies authority to publish. That is not the same as documented consent from
 * participants or guardians, and Nepal's child-protection expectations — and
 * those of the donors and institutions this practice sells to — treat the two
 * differently. Confirm consent is on file. If it is not, the honest options are
 * to obtain it, or to use the frames that do not identify faces.
 */

export interface ImageCredit {
  /** Path under src/assets, without extension. */
  readonly asset: string;
  readonly kind: 'training-photograph' | 'project-screenshot';
  readonly source: string;
  readonly license: string;
  readonly usedOn: readonly string[];
  readonly note?: string;
}

export const imageCredits: readonly ImageCredit[] = [
  // ── Real photographs: Navadisha digital literacy programme, Musahar community
  {
    asset: 'training/training-session',
    kind: 'training-photograph',
    source: 'Navadisha — own photograph, supplied by Bikash Kadayat',
    license: 'Own work',
    usedOn: ['Homepage hero', 'AI for Students — how we run a session'],
    note: 'Shows a delivered digital literacy session. Never caption as the AI workshop.',
  },
  {
    asset: 'training/training-classroom',
    kind: 'training-photograph',
    source: 'Navadisha — own photograph, supplied by Bikash Kadayat',
    license: 'Own work',
    usedOn: ['Homepage programmes band', 'About — in the field', 'AI for Students'],
  },
  {
    asset: 'training/training-students',
    kind: 'training-photograph',
    source: 'Navadisha — own photograph, supplied by Bikash Kadayat',
    license: 'Own work',
    usedOn: ['Homepage Education pillar card', 'Students page hero band'],
  },
  {
    asset: 'training/training-welcome',
    kind: 'training-photograph',
    source: 'Navadisha — own photograph, supplied by Bikash Kadayat',
    license: 'Own work',
    usedOn: ['Institutions page hero band', 'About — in the field'],
  },
  {
    asset: 'training/training-group',
    kind: 'training-photograph',
    source: 'Navadisha — own photograph, supplied by Bikash Kadayat',
    license: 'Own work',
    usedOn: ['About — in the field'],
    note: 'Programme banner in frame carries the Navadisha logo — strongest provenance of the set.',
  },

  // ── Real screenshots of delivered platforms. See src/data/work-images.ts.
  {
    asset: 'projects/nif',
    kind: 'project-screenshot',
    source: 'https://nif.org.np/',
    license: 'Own work — site designed and built by Navadisha',
    usedOn: ['Work index', 'Nepal Internet Foundation case study'],
  },
  {
    asset: 'projects/shikshya',
    kind: 'project-screenshot',
    source: 'https://shikshyatechhub.bikashkadayat.com.np/',
    license: 'Own work — site designed and built by Navadisha',
    usedOn: ['Homepage work grid', 'Work index', 'Sikshya Tech Hub case study'],
  },
  {
    asset: 'projects/ktmkawadi',
    kind: 'project-screenshot',
    source: 'https://ktmkawadi.bikashkadayat.com.np/en/',
    license: 'Own work — site designed and built by Navadisha',
    usedOn: [
      'Homepage work grid',
      'Homepage Technology pillar card',
      'Work index',
      'KTM Kawadi case study',
    ],
  },
  {
    asset: 'projects/stateofyouth',
    kind: 'project-screenshot',
    source: 'https://stateofyouth-din.bikashkadayat.com.np/',
    license: 'Own work — site designed and built by Navadisha',
    usedOn: ['Homepage work grid', 'Work index', 'State of Youth case study'],
  },
] as const;
