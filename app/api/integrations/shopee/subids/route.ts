// app/api/integrations/shopee/subids/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { getUserContext } from "@/lib/auth";

const sb = () => supabaseAdmin().schema("Produto_Afiliado");
const MISSING =
  /(schema cache)|(does not exist)|relation .* does not exist|not find the table/i;

const j = (data: any, status = 200) => NextResponse.json(data, { status });

// GET: retorna subids (by_platform + default) do usuário logado
export async function GET() {
  try {
    const { userId } = getUserContext();
    if (!userId) return j({ error: "unauthorized" }, 401);

    const r = await sb()
      .from("shopee_subids")
      .select("by_platform, \"default\", updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (r.error) {
      if (MISSING.test(r.error.message || "")) return j({ subids: {} });
      return j({ error: r.error.message }, 500);
    }

    return j({
      subids: {
        by_platform: r.data?.by_platform ?? {},
        default: r.data?.default ?? "",
        updated_at: r.data?.updated_at ?? null,
      },
    });
  } catch (e: any) {
    return j({ error: e?.message || String(e) }, 500);
  }
}

// PUT: salva/atualiza subids do usuário logado
export async function PUT(req: NextRequest) {
  try {
    const { userId } = getUserContext();
    if (!userId) return j({ error: "unauthorized" }, 401);

    const body = (await req.json().catch(() => ({}))) as {
      by_platform?: Record<string, string>;
      default?: string;
    };

    const by_platform =
      body?.by_platform && typeof body.by_platform === "object"
        ? body.by_platform
        : {};
    const def = typeof body?.default === "string" ? body.default : "";

    const payload = {
      user_id: userId,
      by_platform,
      default: def,
      updated_at: new Date().toISOString(),
    };

    const r = await sb()
      .from("shopee_subids")
      .upsert(payload, { onConflict: "user_id" })
      .select("by_platform, \"default\"")
      .single();

    if (r.error) {
      if (MISSING.test(r.error.message || "")) {
        return j({ error: "schema_unavailable", message: r.error.message }, 503);
      }
      return j({ error: r.error.message }, 500);
    }

    return j({ ok: true, subids: r.data });
  } catch (e: any) {
    return j({ error: e?.message || String(e) }, 500);
  }
}
