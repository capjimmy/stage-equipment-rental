import { NextRequest, NextResponse } from 'next/server';

// Sends a plain-text email via Resend's REST API. No-ops (soft skip) until
// RESEND_API_KEY is set in the environment, so the order flow never breaks
// before email is configured.
//
// Setup: create a free account at resend.com, verify a sender/domain, then add
//   RESEND_API_KEY   (your Resend key)
//   NOTIFY_FROM      (verified sender, e.g. "예약알림 <noreply@yourdomain.com>")
// to the Vercel project's Environment Variables and redeploy.
//
// NOTE: this endpoint is unauthenticated. It only sends the fixed order-status
// templates the app passes, but before heavy use add rate limiting / an auth
// check to prevent abuse of your Resend quota.
export async function POST(req: NextRequest) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, skipped: 'RESEND_API_KEY not set' });
  }

  let body: { to?: string; subject?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }

  const { to, subject, text } = body;
  if (!to || !subject) {
    return NextResponse.json({ ok: false, error: 'missing to/subject' }, { status: 400 });
  }

  const from = process.env.NOTIFY_FROM || 'onboarding@resend.dev';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, text: text || subject }),
    });
    const data = await res.json();
    return NextResponse.json({ ok: res.ok, data }, { status: res.ok ? 200 : 502 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
