export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "@/lib/auth";
import supabaseAdmin from "@/lib/supabaseAdmin";

const SB = () => supabaseAdmin().schema("Produto_Afiliado");

const j = (data: any, status = 200) => NextResponse.json(data, { status });

export async function GET() {
  const { userId } = getUserContext();
  if (!userId) return j({ error: "unauthorized" }, 401);

  const r = await SB()
    .from("shopee_subids")
    .select("by_platform, default, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (r.error) return j({ error: r.error.message }, 500);

  return j({
    subids: r.data
      ? { by_platform: r.data.by_platform || {}, default: r.data.default || "" }
      : { by_platform: {}, default: "" },
  });
}

export async function PUT(req: NextRequest) {
  const { userId } = getUserContext();
  if (!userId) return j({ error: "unauthorized" }, 401);

  const body = await req.json().catch(() => ({} as any));
  const by_platform = body?.by_platform && typeof body.by_platform === "object"
    ? body.by_platform
    : {};
  const def = typeof body?.default === "string" ? body.default : "";

  const payload = {
    user_id: userId,
    by_platform,
    default: def,
    updated_at: new Date().toISOString(),
  };

  const r = await SB()
    .from("shopee_subids")
    .upsert(payload, { onConflict: "user_id" })
    .select("user_id")
    .single();

  if (r.error) return j({ error: r.error.message }, 500);
  return j({ ok: true });
}
