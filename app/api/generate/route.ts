import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "@/lib/auth";

const N8N_CAPTION_URL =
  process.env.N8N_CAPTION_URL ||
  (process.env.N8N_BASE_URL
    ? process.env.N8N_BASE_URL.replace(/\/+$/, "") + "/webhook/caption"
    : "https://n8n.seureview.com.br/webhook/caption");

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));

  // tenta obter contexto do usuário logado
  let ctx: { userId?: string; orgId?: string } = {};
  try {
    ctx = getUserContext(); // ✅ sem argumentos
  } catch {
    // sessão ausente: segue mesmo assim
  }

  try {
    const resp = await fetch(N8N_CAPTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, ...ctx }),
    });

    const text = await resp.text();
    if (!resp.ok) {
      return NextResponse.json(
        { error: `n8n ${resp.status} :: ${text}` },
        { status: 502 }
      );
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    const kind = body?.kind as string | undefined;
    if (kind === "instagram_caption" || kind === "facebook_caption") {
      const caption =
        data?.caption ?? data?.data?.caption ?? data?.result?.caption ?? data;
      return NextResponse.json({ caption });
    }
    if (kind === "feed_mock") {
      const imageUrl = data?.imageUrl ?? data?.url ?? data?.image ?? null;
      return NextResponse.json({ imageUrl });
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "generate proxy error" },
      { status: 500 }
    );
  }
}