export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUserContext } from "@/lib/auth";

function j(res: any, status = 200) {
  return NextResponse.json(res, { status });
}

// garante que existe uma org (evita "Org inexistente")
async function ensureOrg(sb: ReturnType<typeof supabaseAdmin>, orgId: string) {
  // sua tabela pode se chamar "orgs" ou "user_orgs"; ajuste se preciso
  const { data, error } = await sb.from("orgs").select("id").eq("id", orgId).maybeSingle();
  if (error) throw new Error(`Falha ao verificar orgs: ${error.message}`);
  if (!data) {
    // cria silenciosamente
    const { error: insErr } = await sb.from("orgs").insert({ id: orgId, name: "default" });
    if (insErr) throw new Error(`Falha ao criar org: ${insErr.message}`);
  }
}

// GET: ler credenciais (não devolve o secret)
export async function GET() {
  try {
    const { orgId } = getUserContext();
    const sb = supabaseAdmin();
    await ensureOrg(sb, orgId);

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
    await ensureOrg(sb, orgId);

    const body = await req.json().catch(() => ({} as any));
    const { appId, secret, region, active } = body || {};
    if (!appId || !secret) return j({ error: "appId e secret são obrigatórios" }, 400);

    const upsert = {
      org_id: orgId,               // UUID
      app_id: String(appId),
      secret: String(secret),      // fica guardado no banco
      region: String(region || "BR"),
      active: Boolean(active ?? true),
      updated_at: new Date().toISOString(),
    };

    const { error } = await sb
      .from("shopee_credentials")
      .upsert(upsert, { onConflict: "org_id" });

    if (error) return j({ error: error.message }, 500);
    return j({ ok: true });
  } catch (e: any) {
    return j({ error: String(e?.message || e) }, 400);
  }
}
