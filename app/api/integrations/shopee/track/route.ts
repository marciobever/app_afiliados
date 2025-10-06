// app/api/integrations/shopee/track/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "@/lib/auth";

const N8N_SUBIDS_URL =
  process.env.N8N_SUBIDS_URL ||
  process.env.N8N_SUBIDS_WEBHOOK_URL ||
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

function j(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

// GET: health/debug
export async function GET() {
  return j({
    ok: true,
    url: N8N_SUBIDS_URL,
    hasSecret: Boolean(process.env.N8N_SECRET),
  });
}

// POST: gera shortlink com subids
export async function POST(req: NextRequest) {
  const traceId = Math.random().toString(36).slice(2, 8);

  try {
    const { userId, orgId } = getUserContext();
    if (!userId) return j({ error: "unauthorized" }, 401);

    const body = (await req.json().catch(() => ({}))) as {
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

    if (!body.base_url) return j({ error: "missing_base_url" }, 400);
    if (!body.platform) return j({ error: "missing_platform" }, 400);

    const p = body.product ?? {};
    const pUrl = p?.url || body.base_url;
    const pId =
      (p?.id && String(p.id).trim()) || deriveShopeeIdFromUrl(pUrl) || "";

    const product = {
      id: pId,
      title: p?.title ?? "",
      price:
        typeof p?.price === "number"
          ? p.price
          : p?.price != null
          ? Number(p.price)
          : null,
      rating:
        typeof p?.rating === "number"
          ? p.rating
          : p?.rating != null
          ? Number(p.rating)
          : null,
      image: p?.image ?? "",
      url: pUrl,
    };

    const payload = {
      base_url: body.base_url,
      platform: body.platform,
      sub_profile: body.sub_profile ?? "",
      product,
      userId,
      orgId,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (process.env.N8N_SECRET)
      headers["x-api-key"] = process.env.N8N_SECRET;

    const res = await fetch(N8N_SUBIDS_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const raw = await res.text();
    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      data = { raw };
    }

    if (!res.ok) {
      return j(
        {
          error: `n8n_error_${res.status}`,
          traceId,
          data,
        },
        502
      );
    }

    // Normalizações comuns de retorno
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

    return j({ url, subids_used: subids, traceId }, 200);
  } catch (e: any) {
    return j({ error: "subids_proxy_failed", message: e?.message || String(e), traceId }, 500);
  }
}
