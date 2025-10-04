// app/api/caption/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "@/lib/auth";

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
    const base = process.env.N8N_BASE_URL?.replace(/\/+$/, "");
    if (!base) {
      return NextResponse.json(
        { error: "N8N_BASE_URL ausente no .env" },
        { status: 500 }
      );
    }
    const N8N_URL = `${base}/webhook/caption`;

    const body = await req.json().catch(() => ({} as any));

    // pega user/org do cookie; aceita tanto userId quanto userIdNorm
    let userId = "";
    let orgId = "";
    try {
      const ctx = getUserContext() as any;
      userId = ctx.userId ?? ctx.userIdNorm ?? "";
      orgId = ctx.orgId ?? "";
    } catch {
      // segue sem sessão
    }

    const payload = { ...body, userId, orgId };

    const n8nRes = await fetch(N8N_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await n8nRes.text();

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
