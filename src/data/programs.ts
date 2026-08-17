/* ============================================================================
   PROGRAMME LINES — shared definitions
   ----------------------------------------------------------------------------
   Single source for the four programme lines, read by the Services mega menu
   AND the homepage programmes section. Previously the three in-development
   lines were hard-coded on the homepage; that would have drifted the moment the
   menu was added.

   ⚠ STATUS IS LOAD-BEARING (Phase-1 plan §05):
       running          delivered at least once  → links to a detail page
       planned          defined, trainer named   → links, status visible
       in-development   named intent only        → NO link. Nothing behind it.

   ⚠ PROGRAMS RESTORE RULE (client-approved, Aug 2026):
   Programs returns to TOP-LEVEL navigation only when ALL of the following hold:
       · at least 2 programmes have been delivered
       · at least 2 programmes have confirmed dates
       · at least 2 programmes are at 'running' status
   Until then it lives inside the Services mega menu. `programsEarnTopLevel()`
   below encodes the test so the decision is checkable rather than remembered.
============================================================================ */

export type ProgramStatus = 'running' | 'planned' | 'in-development';

export interface ProgramLine {
  title: string;
  status: ProgramStatus;
  /** Only set once a detail page exists AND status is not 'in-development'. */
  href?: string;
  detail?: string;
  timing?: string;
}

export const programLines: ProgramLine[] = [
  {
    title: 'AI for Students',
    status: 'planned',
    href: '/programs/ai-for-students/',
    detail: 'One day · school and college students · on-site or hybrid',
    timing: 'Tentatively October 2026',
  },
  { title: 'Networking Training', status: 'in-development' },
  { title: 'Digital Skills', status: 'in-development' },
  { title: 'Corporate Training', status: 'in-development' },
];

export const statusLabel: Record<ProgramStatus, string> = {
  running: 'Running',
  planned: 'Planned',
  'in-development': 'In development',
};

/** A programme may only be linked when it is not merely a named intent. */
export function isLinkable(p: ProgramLine): boolean {
  return Boolean(p.href) && p.status !== 'in-development';
}

/**
 * The restore test. Returns false today. When it returns true, add
 * { label: 'Programs', href: '/programs/' } back to primaryNav in nav.ts.
 */
export function programsEarnTopLevel(): boolean {
  return programLines.filter((p) => p.status === 'running').length >= 2;
}
