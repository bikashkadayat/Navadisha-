/* ============================================================================
   NAVADISHA — CONTENT COLLECTIONS
   ----------------------------------------------------------------------------
   Phase-0 doc §5.5 and §13.1. These schemas ARE the Phase-2 Django models.
   The 1:1 mapping is the entire reason the Django migration is a data-source
   swap rather than a rewrite:

     services      -> Service                  team         -> TeamMember
     programs      -> Program + Cohort         testimonials -> Testimonial
     work          -> CaseStudy                partners     -> Partner
     insights      -> Article + Category       positions    -> JobPosting

   RULES (enforce in review — the "no redesign" promise depends on them):
     1. Components read from collections. Never hard-code content in markup.
     2. Component props are data objects, not loose strings.
     3. Adding a field here means adding it to the Django model too.
============================================================================ */

import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** Which practice a thing belongs to. Drives accent, iconography, voice. */
const pillar = z.enum(['education', 'technology']);

/** Institution / buyer segments — the audience axis of the IA (§5.1). */
const sector = z.enum([
  'school',
  'college',
  'university',
  'development',   // NGO / INGO
  'government',
  'business',      // SME / corporate
  'training',      // training centres
  'student',
]);

/* -------------------------------------------------------------- services */
const services = defineCollection({
  loader: glob({ base: './src/content/services', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    pillar,
    order: z.number().default(99),
    /** Nav label when the full title is too long for the mega-panel. */
    navLabel: z.string().optional(),
    /** One line. Used on cards and in the mega-panel. */
    summary: z.string(),
    /** Opens the page. The reader's problem, in the reader's language (§10.1). */
    problem: z.string(),
    deliverables: z.array(z.string()).min(1),
    outcomes: z.array(z.string()).default([]),
    phases: z
      .array(z.object({ name: z.string(), detail: z.string(), duration: z.string().optional() }))
      .default([]),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    /** Same-pillar siblings. */
    related: z.array(reference('services')).default([]),
    /**
     * REQUIRED cross-pillar link + why (§6.3). This is the mechanism that
     * monetises the integration story. `rationale` must be a real connective
     * sentence, never "you may also like".
     */
    crossPillar: z
      .object({ service: reference('services'), rationale: z.string() })
      .optional(),
    seo: z.object({ title: z.string().max(60), description: z.string().max(155) }),
    draft: z.boolean().default(false),
  }),
});

/* -------------------------------------------------------------- programs */
const programs = defineCollection({
  loader: glob({ base: './src/content/programs', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    order: z.number().default(99),
    summary: z.string(),
    level: z.enum(['foundation', 'intermediate', 'advanced', 'mixed']),
    format: z.array(z.enum(['on-site', 'remote', 'hybrid'])).min(1),
    duration: z.string(),
    prerequisites: z.array(z.string()).default([]),
    /** Specific and testable. Vague outcomes read as "not built yet" (§10.2). */
    outcomes: z.array(z.string()).min(1),
    syllabus: z
      .array(z.object({ module: z.string(), topics: z.array(z.string()) }))
      .default([]),
    /** Named trainers with credentials are what convert P7 (§4, persona 7). */
    trainers: z.array(reference('team')).default([]),
    /**
     * `null` is explicit and meaningful: no certification is claimed for this
     * programme. Distinct from the field being forgotten. A certification claim
     * is a promise to the learner — never populate it speculatively.
     */
    certification: z.string().nullable().default(null),
    /** Phase-3 LMS: this becomes the Cohort model. Enrolment state is added there. */
    cohorts: z
      .array(
        z.object({
          startDate: z.coerce.date(),
          endDate: z.coerce.date().optional(),
          location: z.string().optional(),
          status: z.enum(['forming', 'open', 'full', 'running', 'closed']).default('forming'),
        }),
      )
      .default([]),
    /** null = "on request". Blocker #8 decides whether these are published. */
    feeNPR: z.number().nullable().default(null),
    placementSupport: z.boolean().default(false),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    seo: z.object({ title: z.string().max(60), description: z.string().max(155) }),
    draft: z.boolean().default(false),
  }),
});

/* ------------------------------------------------------------------ work */
const work = defineCollection({
  loader: glob({ base: './src/content/work', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    /** Real name, or a described type when anonymised. Never invented (§10.1). */
    client: z.string(),
    anonymised: z.boolean().default(false),
    /**
     * `illustrative` marks a "Method Applied" piece — the framework shown on a
     * hypothetical scenario while real cases are still landing (§8 S5 fallback).
     * Templates MUST render a visible label for these. Never quietly present
     * an illustrative piece as a delivered engagement.
     */
    illustrative: z.boolean().default(false),
    sector,
    pillars: z.array(pillar).min(1),   // 2 entries => "Education + Technology" badge
    date: z.coerce.date(),
    challenge: z.string(),
    approach: z.string(),
    /** At least one verified outcome. */
    outcomes: z.array(z.object({ metric: z.string(), value: z.string() })).min(1),
    /**
     * What changed for the organisation, in prose. Distinct from `outcomes`,
     * which are the checkable facts. Impact must still be verified — it is not
     * a licence to speculate about benefit.
     */
    impact: z.string().optional(),
    /**
     * Honest reflection on the engagement, written in the first person. This is
     * the ONE place a case study may contain something other than verified
     * client fact, because it is explicitly our own view of our own work.
     * It must never be used to imply a client outcome we cannot evidence.
     */
    lessons: z.array(z.object({ title: z.string(), body: z.string() })).default([]),
    /** Set true when no quantified result is available yet. Renders a visible note. */
    metricsPending: z.boolean().default(false),
    servicesApplied: z.array(reference('services')).default([]),
    testimonial: reference('testimonials').optional(),
    cover: z.string().optional(),
    featured: z.boolean().default(false),
    seo: z.object({ title: z.string().max(60), description: z.string().max(155) }),
    draft: z.boolean().default(false),
  }),
});

/* -------------------------------------------------------------- insights
   Lives at /insights/ permanently. The Phase-2 blog inherits this URL space
   and its accumulated SEO equity rather than starting cold (§5.5, §11.3). */
const insights = defineCollection({
  loader: glob({ base: './src/content/insights', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    author: reference('team'),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    category: z.enum([
      'institutional-strategy',
      'career-guidance',
      'technology',
      'industry-linkage',
      'firm-news',
    ]),
    tags: z.array(z.string()).default([]),
    excerpt: z.string(),
    readingTime: z.number().optional(),
    /** Gated lead magnet attached to this article (§11.5). */
    resource: z
      .object({ label: z.string(), file: z.string(), gated: z.boolean().default(true) })
      .optional(),
    relatedServices: z.array(reference('services')).default([]),
    featured: z.boolean().default(false),
    seo: z.object({ title: z.string().max(60), description: z.string().max(155) }),
    draft: z.boolean().default(false),
  }),
});

/* ------------------------------------------------------------------ team
   Blocker #3. The single highest-impact trust asset on the site (§12.4). */
const team = defineCollection({
  loader: glob({ base: './src/content/team', pattern: '**/*.md' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    order: z.number().default(99),
    leadership: z.boolean().default(false),
    credentials: z.array(z.string()).default([]),
    /** 100–150 words, incl. one human detail (§10.2). */
    bio: z.string(),
    /**
     * Real photograph. `null` is explicit — it records "photo pending" rather
     * than someone having forgotten the field. The team template falls back to
     * initials set in the display face, which looks deliberate; avatar
     * placeholders do not. Populate this and it upgrades automatically.
     */
    photo: z.string().nullable().default(null),
    email: z.string().email().optional(),
    linkedin: z.string().url().optional(),
    practices: z.array(pillar).default([]),
  }),
});

/* ---------------------------------------------------------- testimonials
   Attribution is required by schema. An unattributable quote cannot be
   authored here at all — that is deliberate (§10.2). */
const testimonials = defineCollection({
  loader: glob({ base: './src/content/testimonials', pattern: '**/*.md' }),
  schema: z.object({
    quote: z.string(),
    authorName: z.string(),
    authorRole: z.string(),
    organisation: z.string(),
    photo: z.string().optional(),
    serviceRef: reference('services').optional(),
    workRef: reference('work').optional(),
    /** Written permission on file. Nothing renders without it. */
    consentOnFile: z.literal(true),
    featured: z.boolean().default(false),
  }),
});

/* -------------------------------------------------------------- partners
   `relationship` is required so a logo can never imply a client relationship
   that does not exist — the most damaging form of website dishonesty (§10.2). */
const partners = defineCollection({
  loader: glob({ base: './src/content/partners', pattern: '**/*.md' }),
  schema: z.object({
    name: z.string(),
    relationship: z.enum(['client', 'delivery-partner', 'network', 'accreditation']),
    logo: z.string(),
    url: z.string().url().optional(),
    current: z.boolean().default(true),
    consentOnFile: z.literal(true),
    order: z.number().default(99),
  }),
});

/* ------------------------------------------------------------- positions */
const positions = defineCollection({
  loader: glob({ base: './src/content/positions', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    type: z.enum(['full-time', 'part-time', 'contract', 'internship']),
    location: z.string(),
    practice: pillar.optional(),
    posted: z.coerce.date(),
    closes: z.coerce.date().optional(),
    summary: z.string(),
    responsibilities: z.array(z.string()).default([]),
    requirements: z.array(z.string()).default([]),
    open: z.boolean().default(true),
  }),
});

export const collections = {
  services,
  programs,
  work,
  insights,
  team,
  testimonials,
  partners,
  positions,
};
