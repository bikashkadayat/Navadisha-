/* ============================================================================
   NAVADISHA — FORM RELAY WORKER
   ----------------------------------------------------------------------------
   Phase-0 doc §12.2. Solves the static-hosting constraint (risk R5): GitHub
   Pages serves files only, so there is no server to receive a form POST.

   Why a Worker rather than Formspree / Netlify Forms / Google Forms:
     · Runs on Navadisha's own domain — no third-party branding at the exact
       moment a buyer is deciding whether to trust the firm.
     · Leads land in Navadisha's OWN datastore from day one. When the Phase-2
       Django CRM launches there is real lead history to import rather than a
       cold start. This is the single biggest reason not to outsource it.
     · Cloudflare is already in the stack, so marginal cost is zero.

   ⚠ THE CONTRACT BELOW IS LOAD-BEARING. `LeadPayload` is deliberately shaped to
   match the Phase-2 Django `Lead` model and its DRF serializer. When Django
   goes live, the frontend changes ONE constant (the endpoint URL) and nothing
   else. Do not add fields here without adding them to the Django model.

   Explicitly NOT a mailto: link — those fail silently on most mobile devices
   and lose the majority of submissions.
============================================================================ */

export interface Env {
  LEADS: KVNamespace;
  TURNSTILE_SECRET: string;
  RESEND_API_KEY: string;
  NOTIFY_TO: string;
  NOTIFY_FROM: string;
  ALLOWED_ORIGIN: string;
}

/** Mirrors the Phase-2 Django Lead model. Keep in sync. */
interface LeadPayload {
  name: string;
  email: string;
  phone?: string;
  organisation?: string;
  /** Which journey produced this lead — drives CRM routing (§4.1). */
  audience: 'institution' | 'student' | 'business' | 'training' | 'other';
  /** Slug of the service/programme page the enquiry came from, if any. */
  sourcePage?: string;
  serviceRef?: string;
  message: string;
  /** Honeypot. Must be empty. Named innocuously so bots fill it. */
  website?: string;
  turnstileToken?: string;
}

const MAX_MESSAGE = 5000;
const RATE_LIMIT_PER_HOUR = 5;

function json(body: unknown, status = 200, origin = '*'): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': origin,
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'cache-control': 'no-store',
    },
  });
}

function validate(p: Partial<LeadPayload>): string | null {
  if (!p.name?.trim()) return 'Please tell us your name.';
  if (!p.email?.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email)) {
    return 'Please enter an email address we can reply to.';
  }
  if (!p.message?.trim()) return 'Please tell us briefly what you need.';
  if (p.message.length > MAX_MESSAGE) return 'That message is longer than we can accept.';
  if (!p.audience) return 'Please tell us which of these describes you.';
  return null;
}

async function verifyTurnstile(token: string | undefined, secret: string, ip: string) {
  if (!token) return false;
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  form.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  });
  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}

async function rateLimited(env: Env, ip: string): Promise<boolean> {
  const key = `rl:${ip}:${new Date().toISOString().slice(0, 13)}`; // per hour
  const current = Number((await env.LEADS.get(key)) ?? '0');
  if (current >= RATE_LIMIT_PER_HOUR) return true;
  await env.LEADS.put(key, String(current + 1), { expirationTtl: 3600 });
  return false;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = env.ALLOWED_ORIGIN || '*';

    if (request.method === 'OPTIONS') return json({}, 204, origin);
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, origin);

    // Same-origin guard.
    const reqOrigin = request.headers.get('origin');
    if (env.ALLOWED_ORIGIN && reqOrigin && reqOrigin !== env.ALLOWED_ORIGIN) {
      return json({ error: 'Forbidden' }, 403, origin);
    }

    let payload: Partial<LeadPayload>;
    try {
      payload = (await request.json()) as Partial<LeadPayload>;
    } catch {
      return json({ error: 'We could not read that submission. Please try again.' }, 400, origin);
    }

    // Honeypot: silently accept so bots do not learn they were caught.
    if (payload.website) return json({ ok: true }, 200, origin);

    const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
    if (await rateLimited(env, ip)) {
      return json(
        { error: 'That is several messages in a short time. Please email us directly.' },
        429,
        origin,
      );
    }

    const invalid = validate(payload);
    if (invalid) return json({ error: invalid }, 400, origin);

    if (env.TURNSTILE_SECRET && !(await verifyTurnstile(payload.turnstileToken, env.TURNSTILE_SECRET, ip))) {
      return json({ error: 'We could not verify that submission. Please try again.' }, 400, origin);
    }

    const lead = {
      id: crypto.randomUUID(),
      receivedAt: new Date().toISOString(),
      name: payload.name!.trim(),
      email: payload.email!.trim().toLowerCase(),
      phone: payload.phone?.trim() ?? null,
      organisation: payload.organisation?.trim() ?? null,
      audience: payload.audience!,
      sourcePage: payload.sourcePage ?? null,
      serviceRef: payload.serviceRef ?? null,
      message: payload.message!.trim(),
      ip,
      userAgent: request.headers.get('user-agent') ?? null,
    };

    // 1. Persist FIRST. If email delivery fails we must not lose the lead —
    //    this store is the Phase-2 CRM's seed data.
    await env.LEADS.put(`lead:${lead.receivedAt}:${lead.id}`, JSON.stringify(lead));

    // 2. Notify the team, and 3. acknowledge the sender. Neither failure is
    //    surfaced to the visitor, because the lead is already safely stored.
    const send = (to: string, subject: string, text: string) =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${env.RESEND_API_KEY}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ from: env.NOTIFY_FROM, to, subject, text }),
      }).catch(() => undefined);

    await Promise.allSettled([
      send(
        env.NOTIFY_TO,
        `New ${lead.audience} enquiry — ${lead.name}`,
        [
          `Name:         ${lead.name}`,
          `Email:        ${lead.email}`,
          `Phone:        ${lead.phone ?? '—'}`,
          `Organisation: ${lead.organisation ?? '—'}`,
          `Audience:     ${lead.audience}`,
          `Source page:  ${lead.sourcePage ?? '—'}`,
          `Service:      ${lead.serviceRef ?? '—'}`,
          '',
          lead.message,
        ].join('\n'),
      ),
      // The acknowledgement states what happens next and when. A bare
      // "thank you" is a missed commitment (§12.3).
      send(
        lead.email,
        'We have your message — Navadisha',
        [
          `Dear ${lead.name},`,
          '',
          'Thank you for getting in touch. A member of our team will reply within one',
          'working day.',
          '',
          'For reference, this is what you sent us:',
          '',
          lead.message,
          '',
          '—',
          'Navadisha Consulting & Innovations Pvt. Ltd.',
        ].join('\n'),
      ),
    ]);

    return json({ ok: true, id: lead.id }, 200, origin);
  },
};
