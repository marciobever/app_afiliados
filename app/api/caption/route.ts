// app/api/caption/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "@/lib/auth";

const N8N_URL =
  process.env.N8N_BASE_URL?.replace(/\/+$/, "") + "/webhook/caption";

function stripFences(s: string) {
  return s
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.N8N_BASE_URL) {
      return NextResponse.json(
        { error: "N8N_BASE_URL ausente no .env.local" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({} as any));
    // pega user/org do cookie (ou headers x-user-id/x-org-id)
    let userId = "", orgId = "";
    try {
      const ctx = getUserContext();
      userId = ctx.userId;
      orgId = ctx.orgId;
    } catch {
      // segue sem, se não tiver sessão (não quebra)
    }

    // monta payload para o n8n
    const payload = {
      ...body,
      userId,
      orgId,
    };

    const n8nRes = await fetch(N8N_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await n8nRes.text();

    // tenta devolver JSON puro (n8n pode mandar cercas ```json)
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      try {
        data = JSON.parse(stripFences(text));
      } catch {
        data = { raw: text };
      }
    }

    // se o n8n retornou erro http, propague
    if (!n8nRes.ok) {
      return NextResponse.json(
        { error: "n8n_error", status: n8nRes.status, data },
        { status: 502 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "caption_route_failed", message: e?.message || String(e) },
      { status: 500 }
    );
  }
}