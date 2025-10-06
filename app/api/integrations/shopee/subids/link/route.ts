import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const N8N_SUBIDS_URL =
  process.env.N8N_SUBIDS_URL ||
  process.env.N8N_SUBIDS_WEBHOOK_URL || // aceita ambos
  "https://n8n.seureview.com.br/webhook/shopee_subids";

function deriveShopeeIdFromUrl(url?: string): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p.toLowerCase() === "product");
    if (idx >= 0 && parts[idx + 1] && parts[idx + 2]) {
      return `${parts[idx + 1]}_${parts[idx + 2]}`;
    }
  } catch {}
  return "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    if (!body?.base_url) return NextResponse.json({ error: "missing_base_url" }, { status: 400 });
    if (!body?.platform) return NextResponse.json({ error: "missing_platform" }, { status: 400 });

    // contexto do cookie
    const { userId, orgId } = getUserContext();

    // produto “safe”
    const pIn = body.product ?? {};
    const pUrl = pIn?.url || body.base_url;
    const product = {
      id:
        (pIn?.id && String(pIn.id)) ||
        deriveShopeeIdFromUrl(pUrl) ||
        "",
      title: pIn?.title ?? "",
      price: pIn?.price != null ? Number(pIn.price) : null,
      rating: pIn?.rating != null ? Number(pIn.rating) : null,
      image: pIn?.image ?? "",
      url: pUrl,
    };

    const payload = {
      base_url: body.base_url,
      platform: body.platform,
      sub_profile: body.sub_profile ?? "",
      product,
      user_id: userId || null,  // n8n espera user_id/org_id
      org_id: orgId || null,
    };

    const r = await fetch(N8N_SUBIDS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.N8N_SECRET ? { "x-api-key": process.env.N8N_SECRET } : {}),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await r.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!r.ok) {
      return NextResponse.json({ error: `n8n_error_${r.status}`, data }, { status: 502 });
    }

    const url =
      data?.url ||
      data?.shortLink ||
      data?.data?.url ||
      data?.items?.[0]?.url ||
      data?.data?.generateShortLink?.shortLink ||
      "";

    const subids =
      data?.subids_used ||
      data?.subIds ||
      data?.subids ||
      data?.info?.subids ||
      [];

    return NextResponse.json({ url, subids_used: subids }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "subids_proxy_failed", message: e?.message || String(e) },
      { status: 500 }
    );
  }
}
