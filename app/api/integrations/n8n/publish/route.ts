import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const N8N_PUBLISH_WEBHOOK =
  process.env.N8N_PUBLISH_WEBHOOK_URL ||
  (process.env.N8N_BASE_URL
    ? process.env.N8N_BASE_URL.replace(/\/+$/, '') + '/webhook/publish_post'
    : '');

export async function POST(req: NextRequest) {
  if (!N8N_PUBLISH_WEBHOOK) {
    return NextResponse.json({ error: 'N8N_PUBLISH_WEBHOOK_URL ausente' }, { status: 500 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  // normaliza scheduleTime para ISO (ou remove)
  if (body?.scheduleTime) {
    const d = new Date(body.scheduleTime);
    if (isNaN(d.getTime())) {
      return NextResponse.json(
        { error: 'scheduleTime inválido. Use ISO ex: 2025-10-05T18:00:00-03:00' },
        { status: 400 }
      );
    }
    body.scheduleTime = d.toISOString();
  } else {
    delete body.scheduleTime;
  }

  const r = await fetch(N8N_PUBLISH_WEBHOOK, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.N8N_SECRET || '',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const text = await r.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (!r.ok) {
    return NextResponse.json(
      { error: `n8n responded ${r.status}`, detail: data },
      { status: 502 },
    );
  }

  return NextResponse.json(data);
}
