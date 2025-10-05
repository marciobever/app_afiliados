// app/api/integrations/shopee/subids/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "@/lib/auth";

export const dynamic = "force-dynamic";

const N8N_SUBIDS_URL =
  process.env.N8N_SUBIDS_URL ||
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
    const body = (await req.json().catch(() => ({} as any))) as {
      base_url?: string;
      platform?: "facebook" | "instagram" | "x" | string;
      sub_profile?: string;
      product?: {
        id?: string;
        title?: string;
        price?: number | string | null;
        rating?: number | string | null;
        image?: string;
        url?: string;
      } | null;
    };

    // Validações
    if (!body?.base_url) {
      return NextResponse.json(
        { error: "missing_base_url", message: "Informe base_url" },
        { status: 400 }
      );
    }
    if (!body?.platform) {
      return NextResponse.json(
        { error: "missing_platform", message: "Informe platform" },
        { status: 400 }
      );
    }

    // Contexto (opcional)
    let userId = "";
    let orgId = "";
    try {
      const ctx = getUserContext() as any;
      userId = ctx?.userId ?? ctx?.userIdNorm ?? "";
      orgId = ctx?.orgId ?? "";
    } catch {}

    // Fallback de product quando vier ausente/incompleto
    const pIn = body.product ?? {};
    const pUrl = pIn?.url || body.base_url;
    const pId =
      (pIn?.id && String(pIn.id).trim()) ||
      deriveShopeeIdFromUrl(pUrl) ||
      "";

    const product = {
      id: pId,
      title: pIn?.title ?? "",
      price:
        typeof pIn?.price === "number"
          ? pIn.price
          : pIn?.price != null
          ? Number(pIn.price)
          : null,
      rating:
        typeof pIn?.rating === "number"
          ? pIn.rating
          : pIn?.rating != null
          ? Number(pIn.rating)
          : null,
      image: pIn?.image ?? "",
      url: pUrl,
    };

    const payload = {
      base_url: body.base_url,
      platform: body.platform,
      sub_profile: body.sub_profile ?? "",
      product, // ← nunca null
      userId,
      orgId,
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
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!r.ok) {
      return NextResponse.json(
        { error: `n8n_error_${r.status}`, data },
        { status: 502 }
      );
    }

    // Normalização do retorno
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
