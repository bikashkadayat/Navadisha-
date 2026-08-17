/* ============================================================================
   NAVADISHA — NAVIGATION
   ----------------------------------------------------------------------------
   FIVE primary items. Matches Deloitte and McKinsey exactly; none of the six
   benchmarked references exceeds five.

   Three axes, deliberately paired:
       Institutions · Students   →  audience
       Services ▾                →  offering
       Work · About              →  credibility

   DECISIONS ON RECORD (navigation audit, client-approved Aug 2026):

   · NO 'Home'. The logo is the universal home affordance. None of Stripe,
     Linear, Accenture, Deloitte, McKinsey or Notion carries one.

   · NO 'Contact'. It already exists as the primary CTA button. A nav word and
     a filled button pointing at the same page dilutes the button.

   · NO 'Insights'. Zero articles. A nav item leading to an empty index is worse
     than its absence. Restore at ≥3 published articles.

   · NO 'Programs' at top level. One unbookable workshop does not justify a slot;
     it now lives inside the Services mega menu with more visibility than a nav
     word gave it. See `programsEarnTopLevel()` in data/programs.ts for the
     checkable restore condition.

   · 'About' KEPT at top level, against consulting-firm convention. At Deloitte
     About is a footer utility because nobody questions whether Deloitte exists.
     For a founder-led practice with one case study and registration pending,
     "who are these people?" is the most common unanswered question on the site.
     Revisit once there is a track record to stand behind instead.

   · CTA reads 'Book a Conversation', not 'Talk to Us'. Outcome language beats
     channel language, and it matches the supporting line used site-wide.

   HARD CEILING: six top-level items, permanently. Growth is absorbed by
   deepening the mega menu, never by widening the bar.
============================================================================ */

export interface NavItem {
  label: string;
  href: string;
  description?: string;
}

export const primaryNav: NavItem[] = [
  { label: 'Institutions', href: '/institutions/' },
  { label: 'Students', href: '/students/' },
  { label: 'Services', href: '/services/' }, // the only mega panel
  { label: 'Work', href: '/work/' },
  { label: 'About', href: '/about/' },
];

export const primaryCta: NavItem = { label: 'Book a Conversation', href: '/contact/' };

/**
 * Mega-menu group order. Education first — the practice the positioning leads
 * with. Programmes renders as a visually distinct block rather than a third
 * equal column, because a programme is a different KIND of thing from a
 * service: scheduled, per-seat, recurring. Showing that beats asserting it.
 */
export const megaGroups = [
  { key: 'education' as const, heading: 'Education' },
  { key: 'technology' as const, heading: 'Technology' },
];

/** Right-hand promotional panel in the mega menu. */
export const megaPromo = {
  heading: 'Guiding ideas. Building futures.',
  body: 'We advise institutions on direction, build the systems they run on, and prepare people for the industry they are entering.',
  ctaLabel: 'Book a conversation',
  ctaHref: '/contact/',
  secondaryLabel: 'Not sure where to start? Describe the situation',
  secondaryHref: '/contact/',
};

export const institutionTypes: NavItem[] = [
  { label: 'Schools', href: '/institutions/schools/', description: 'Grades 1–12' },
  { label: 'Colleges & +2', href: '/institutions/colleges/', description: 'Higher secondary and bachelor’s' },
  { label: 'NGOs & Development', href: '/institutions/development/', description: 'Donor-funded programmes' },
];

export const studentPaths: NavItem[] = [
  { label: 'Career Guidance', href: '/students/career-guidance/' },
  { label: 'Career Assessment', href: '/students/assessment/' },
  { label: 'Workshops & Events', href: '/students/workshops/' },
  { label: 'Student Resources', href: '/students/resources/' },
];

export const footerColumns = [
  {
    heading: 'Practices',
    links: [
      { label: 'Education', href: '/services/#education' },
      { label: 'Technology', href: '/services/#technology' },
      { label: 'Programmes', href: '/programs/' },
      { label: 'For Institutions', href: '/institutions/' },
      { label: 'For Students', href: '/students/' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'Our Story', href: '/about/' },
      { label: 'Our Method', href: '/about/method/' },
      { label: 'Team & Leadership', href: '/about/team/' },
      { label: 'Company & Compliance', href: '/about/company/' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Selected Work', href: '/work/' },
      { label: 'Programmes', href: '/programs/' },
      { label: 'Sitemap', href: '/sitemap/' },
    ],
  },
] as const;

export const legalLinks: NavItem[] = [
  { label: 'Privacy Policy', href: '/privacy/' },
  { label: 'Terms of Use', href: '/terms/' },
];
