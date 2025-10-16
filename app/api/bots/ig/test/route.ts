// app/api/bots/ig/test/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const N8N_BASE_URL = process.env.N8N_BASE_URL!;
  const WEBHOOK_PATH = process.env.N8N_IG_WEBHOOK_PATH || "ig/verify";

  const body = await req.json().catch(() => ({}));
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
              from: { id: "1234567890" }
            }
          }
        ]
      }
    ]
  };

  const url = `${N8N_BASE_URL.replace(/\/+$/,"")}/webhook/${WEBHOOK_PATH}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(sample)
  });

  const txt = await res.text();
  return NextResponse.json({ ok: res.ok, status: res.status, body: txt });
}
