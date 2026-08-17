/**
 * WORK ARTEFACTS — real screenshots of delivered projects.
 *
 * Keyed by case-study id. This is the ONLY source of imagery for the work
 * surfaces (homepage grid, /work/ index, case-study pages), so a project cannot
 * end up with one picture in one place and a different one somewhere else.
 *
 * THE RULE THIS FILE ENFORCES:
 *
 * A picture in a proof slot is a claim. Placing a stock photograph of an office
 * under a client's name asserts "we did this" exactly as a sentence would, and
 * no validator in this build can detect it — CI reads text, not pixels.
 *
 * So every entry here is a screenshot of the live site as delivered. A case
 * study with no real artefact gets NO image; the templates render fine without
 * one. Never add a decorative or illustrative image to this map.
 */

import nif from '../assets/projects/nif.webp';
import shikshya from '../assets/projects/shikshya.webp';
import ktmkawadi from '../assets/projects/ktmkawadi.webp';
import stateofyouth from '../assets/projects/stateofyouth.webp';

export interface WorkImage {
  readonly src: ImageMetadata;
  /**
   * Descriptive, not promotional. States what is visible in the frame — never
   * an outcome, a metric or a relationship the case study has not evidenced.
   */
  readonly alt: string;
  /** The live URL the screenshot was taken from, so it can be re-captured. */
  readonly capturedFrom: string;
}

export const workImages: Readonly<Record<string, WorkImage>> = {
  'nepal-internet-foundation-website': {
    src: nif,
    alt: 'The Nepal Internet Foundation homepage as published, showing its navigation and programme sections.',
    capturedFrom: 'https://nif.org.np/',
  },
  'sikshya-tech-hub': {
    src: shikshya,
    alt: 'The Sikshya Tech Hub homepage, showing its course navigation and subject categories.',
    capturedFrom: 'https://shikshyatechhub.bikashkadayat.com.np/',
  },
  'ktm-kawadi': {
    src: ktmkawadi,
    alt: 'The KTM Kawadi homepage in English, showing the language switch, rate navigation and pickup booking actions.',
    capturedFrom: 'https://ktmkawadi.bikashkadayat.com.np/en/',
  },
  'state-of-youth-digital-inclusion': {
    src: stateofyouth,
    alt: 'The State of Youth Digital Inclusion Nepal homepage, showing its programme and membership navigation.',
    capturedFrom: 'https://stateofyouth-din.bikashkadayat.com.np/',
  },
};

export const workImageFor = (id: string): WorkImage | undefined => workImages[id];
