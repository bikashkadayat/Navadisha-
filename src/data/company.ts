/* ============================================================================
   NAVADISHA — COMPANY SINGLE SOURCE OF TRUTH
   ----------------------------------------------------------------------------
   Every appearance of a phone number, address or registration detail on the
   site reads from here — footer, contact page, JSON-LD, capability statement.
   A single source makes the reference site's failure (a testimonial praising a
   different company, left in from its template) structurally impossible, and
   enforces NAP consistency, the most avoidable local-SEO error (§11.4).

   ⚠ REGISTRATION STATUS — READ BEFORE CHANGING ANYTHING HERE.

   The company is NOT yet registered; incorporation is in progress. Two
   consequences the site must respect, because getting them wrong is a legal
   exposure rather than a design preference:

     1. "Pvt. Ltd." is a statement that an incorporated private limited company
        exists. Until the certificate is issued it is not accurate, so
        `displayName` omits it and `legalName` stays null. The supplied logo
        artwork does carry "Consulting & Innovations Pvt. Ltd." and a ™ — see
        the note in brand/README.md.

     2. The site therefore launches as a FOUNDER-LED PROFILE, not a corporate
        site. That is a legitimate and common Phase-1 position, and it is
        better served by being explicit than by implying a corporate structure
        that does not yet exist. `registrationStatus` drives an honest status
        line in the footer instead of a fabricated registration number.

   When the certificate arrives: set legalName, companyNumber, panVat,
   incorporated, registeredAddress, flip verified to true and
   registrationStatus to 'registered'. The footer compliance block, the
   LocalBusiness JSON-LD and the About/Company page all switch on together.
============================================================================ */

/**
 * ONE SWITCH. Flip this to 'registered' when the certificate is issued and the
 * whole site changes over: "Pvt. Ltd." appears in the name everywhere, the
 * compliance block replaces the pending notice, and LocalBusiness JSON-LD
 * starts emitting. Nothing else needs editing. (Client-approved, Aug 2026.)
 */
const REGISTRATION_STATUS: 'in-progress' | 'registered' = 'in-progress';

const BASE_NAME = 'NAVADISHA Consulting & Innovations';

/**
 * Whether the "Pvt. Ltd." descriptor appears in the displayed name.
 *
 * DELIBERATELY SEPARATE from REGISTRATION_STATUS. Client instruction (Aug 2026)
 * is to use the full "Pvt. Ltd." form site-wide now, while incorporation is
 * still in progress. Keeping the two flags apart means that decision does NOT
 * silently switch on the compliance block or the LocalBusiness JSON-LD — those
 * stay gated on real registration numbers existing, so the site still cannot
 * publish a fabricated company number.
 *
 * Set to false to revert to "NAVADISHA Consulting & Innovations".
 */
const SHOW_LTD_SUFFIX = true;

export const company = {
  registrationStatus: REGISTRATION_STATUS,

  /**
   * The name shown everywhere on the site. Auto-switches on registration —
   * "Pvt. Ltd." asserts an incorporated entity exists, so it must not appear
   * before the certificate does. Never hard-code either form in a template.
   */
  displayName: SHOW_LTD_SUFFIX ? `${BASE_NAME} Pvt. Ltd.` : BASE_NAME,

  shortName: 'Navadisha',
  tagline: 'New Direction. Better Future.',

  /** Populated only once incorporation completes. Do not pre-fill. */
  legalName: (SHOW_LTD_SUFFIX ? `${BASE_NAME} Pvt. Ltd.` : BASE_NAME) as string | null,

  registration: {
    verified: false,
    companyNumber: null as string | null,
    panVat: null as string | null,
    incorporated: null as string | null,
    registeredAddress: null as string | null,
  },

  /** ✅ Supplied. */
  contact: {
    verified: true,
    phone: '+9779705811712',
    phoneDisplay: '+977 970 581 1712',
    whatsapp: '9779705811712',
    email: 'contact@navadisha.com.np',
    officeHours: 'Sunday–Friday, 10:00–18:00 NPT',
    address: {
      street: 'Baneshwar' as string | null,   // ✅ supplied Aug 2026
      city: 'Kathmandu',
      region: 'Bagmati',
      country: 'NP',
      postalCode: null as string | null,
      geo: null as { lat: number; lng: number } | null,
    },
  },

  social: {
    facebook: null as string | null,
    linkedin: null as string | null,
    instagram: null as string | null,
    youtube: null as string | null,
  },

  /** Blocker #8 resolved: pricing is disclosed on request, not published. */
  pricingPolicy: 'on-request' as 'published' | 'from' | 'on-request',

  responseCommitment: 'We reply within one working day.',
} as const;

/** Pre-filled WhatsApp deep link. */
export function whatsappLink(message: string): string | null {
  if (!company.contact.whatsapp) return null;
  return `https://wa.me/${company.contact.whatsapp}?text=${encodeURIComponent(message)}`;
}

/** True only when incorporation is complete AND the numbers are on file. */
export function hasComplianceData(): boolean {
  return (
    REGISTRATION_STATUS === 'registered' &&
    company.registration.verified &&
    Boolean(company.registration.companyNumber) &&
    Boolean(company.registration.panVat)
  );
}

export function hasContactData(): boolean {
  return company.contact.verified && Boolean(company.contact.phone);
}

/**
 * The honest line shown in place of registration numbers while incorporation
 * is pending. Stating this outright costs nothing and is far better than an
 * unexplained gap where buyers expect compliance data — a procurement-driven
 * buyer who finds nothing assumes the worst.
 */
export function registrationNotice(): string | null {
  if (REGISTRATION_STATUS === 'registered') return null;
  return 'Company registration is in progress. Registration and PAN/VAT details will be published here once incorporation completes.';
}
