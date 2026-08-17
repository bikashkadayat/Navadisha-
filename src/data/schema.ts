/* ============================================================================
   STRUCTURED DATA HELPERS
   ----------------------------------------------------------------------------
   JSON-LD is always generated from the SAME data the page renders, never
   authored separately. That is what makes it impossible for schema to drift
   from visible content — a drift Google treats as a quality signal against you.
============================================================================ */

export interface Faq {
  q: string;
  a: string;
}

/** FAQPage schema. Returns undefined for an empty set so nothing is emitted. */
export function faqSchema(faqs: Faq[]) {
  if (!faqs.length) return undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}
