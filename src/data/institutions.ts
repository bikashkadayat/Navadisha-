/* ============================================================================
   INSTITUTION SEGMENTS — shared definitions
   ----------------------------------------------------------------------------
   Single source for the segment set, so the hub selector, the cross-links at
   the foot of each segment page, and any future navigation all read from one
   place and cannot drift apart.

   THREE segments, not five. Phase-1 plan §01 deferred Universities (needs
   credentials and comparable references Navadisha does not yet have) and
   omitted Government (public procurement requires registration and tax
   clearance, so the firm is not currently eligible to tender). Those URLs stay
   reserved and unpublished. Add them here when the gates close — nothing else
   needs editing.
============================================================================ */

export interface Segment {
  slug: string;
  name: string;
  href: string;
  /** One line for the hub selector card. */
  detail: string;
}

export const segments: Segment[] = [
  {
    slug: 'schools',
    name: 'Schools',
    href: '/institutions/schools/',
    detail:
      'Grades 1–12. Digital presence, parent communication, admissions processes and staff digital capability.',
  },
  {
    slug: 'colleges',
    name: 'Colleges & +2',
    href: '/institutions/colleges/',
    detail:
      'Higher secondary and bachelor’s. Institutional systems, plus practical technology capability for your students.',
  },
  {
    slug: 'development',
    name: 'NGOs & Development',
    href: '/institutions/development/',
    detail:
      'Donor-funded and community organisations. Public websites, content architecture and digital literacy delivery.',
  },
];

/** Segments other than the one currently being viewed. */
export function otherSegments(currentSlug: string): Segment[] {
  return segments.filter((s) => s.slug !== currentSlug);
}
