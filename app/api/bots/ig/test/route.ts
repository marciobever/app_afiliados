// app/api/bots/ig/test/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const base = process.env.N8N_BASE_URL;
  const webhookPath = process.env.N8N_IG_WEBHOOK_PATH || "ig/verify";

  // caso ainda não configurado, não quebra
  if (!base) {
    return NextResponse.json({ ok: false, error: "N8N_BASE_URL ausente" }, { status: 200 });
  }

  const body = await req.json().catch(() => ({} as any));
  const sample = body.sample ?? {
    entry: [
      {
        id: "17841476223329089",
        changes: [
          {
            field: "comments",
            value: {
              id: "17999999999999999",
              comment_id: "17999999999999999",
              media_id: body.mediaId || "17900000000000000",
              text: body.text || "quero",
              from: { id: "1234567890" },
            },
          },
        ],
      },
    ],
  };

  const url = new URL(`/webhook/${webhookPath}`, base);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sample),
    cache: "no-store",
  });

  const txt = await res.text();
  return NextResponse.json({ ok: res.ok, status: res.status, body: txt });
}
