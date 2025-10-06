// app/api/integrations/shopee/subids/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "@/lib/auth";
import supabaseAdmin from "@/lib/supabaseAdmin";

const MISSING =
  /(schema cache)|(does not exist)|relation .* does not exist|not find the table/i;

const SB = () => supabaseAdmin().schema("Produto_Afiliado");

function j(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

// GET: lê SubIDs salvos (por usuário)
export async function GET() {
  try {
    const { userId } = getUserContext();
    if (!userId) return j({ error: "unauthorized" }, 401);

    const r = await SB()
      .from("shopee_subids")
      .select("by_platform, default, updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (r.error) {
      if (MISSING.test(r.error.message || "")) {
        // schema ainda não exposto → não quebra a UI
        return j({ subids: { by_platform: {}, default: "" }, fallback: true });
      }
      return j({ error: r.error.message }, 500);
    }

    const by_platform =
      (r.data?.by_platform && typeof r.data.by_platform === "object"
        ? r.data.by_platform
        : {}) as Record<string, string>;

    return j({ subids: { by_platform, default: r.data?.default || "" } });
  } catch (e: any) {
    return j({ error: e?.message || String(e) }, 500);
  }
}

// PUT: salva/atualiza SubIDs (por usuário)
export async function PUT(req: NextRequest) {
  try {
    const { userId } = getUserContext();
    if (!userId) return j({ error: "unauthorized" }, 401);

    const body = (await req.json().catch(() => ({}))) as {
      by_platform?: Record<string, string>;
      default?: string;
    };

    const payload = {
      user_id: userId,
      by_platform: body.by_platform ?? {},
      default: body.default ?? "",
      updated_at: new Date().toISOString(),
    };

    const r = await SB()
      .from("shopee_subids")
      .upsert(payload, { onConflict: "user_id" })
      .select("by_platform, default")
      .single();

    if (r.error) {
      if (MISSING.test(r.error.message || "")) {
        return j(
          { error: "schema_unavailable", message: r.error.message, fallback: true },
          503
        );
      }
      return j({ error: r.error.message }, 500);
    }

    return j({ ok: true, subids: r.data });
  } catch (e: any) {
    return j({ error: e?.message || String(e) }, 500);
  }
}
