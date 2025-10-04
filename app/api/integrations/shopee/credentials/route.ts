// app/api/integrations/shopee/credentials/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUserContext } from "@/lib/auth";

function j(res: any, status = 200) {
  return NextResponse.json(res, { status });
}

// GET: ler credenciais
export async function GET(_req: NextRequest) {
  try {
    const { orgId } = getUserContext();
    const sb = supabaseAdmin();

    const { data, error } = await sb
      .from("shopee_credentials")
      .select("app_id, region, active, updated_at")
      .eq("org_id", orgId)
      .maybeSingle();

    if (error) return j({ error: error.message }, 500);
    return j({ credentials: data || null });
  } catch (e: any) {
    return j({ error: String(e?.message || e) }, 400);
  }
}

// PUT: salvar/atualizar credenciais
export async function PUT(req: NextRequest) {
  try {
    const { orgId } = getUserContext();
    const sb = supabaseAdmin();

    const body = await req.json().catch(() => ({} as any));
    const { appId, secret, region, active } = body || {};
    if (!appId || !secret) return j({ error: "appId e secret são obrigatórios" }, 400);

    const orgCheck = await sb.from("orgs").select("id").eq("id", orgId).maybeSingle();
    if (orgCheck.error) return j({ error: "Falha ao verificar orgs: " + orgCheck.error.message }, 500);
    if (!orgCheck.data) return j({ error: "Org inexistente: " + orgId }, 400);

    const upsert = {
      org_id: orgId,
      app_id: String(appId),
      secret: String(secret),
      region: region || "BR",
      active: active ?? true,
      updated_at: new Date().toISOString(),
    };

    const { error } = await sb.from("shopee_credentials").upsert(upsert, { onConflict: "org_id" });
    if (error) return j({ error: error.message }, 500);
    return j({ ok: true });
  } catch (e: any) {
    return j({ error: String(e?.message || e) }, 400);
  }
}