// app/api/integrations/shopee/credentials/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUserContext } from "@/lib/auth";

function j(res: any, status = 200) {
  return NextResponse.json(res, { status });
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v || ""
  );
}

/** GET: ler credenciais da Shopee para a org do usuário (sem expor secret) */
export async function GET(_req: NextRequest) {
  try {
    const { orgId } = getUserContext();
    if (!isUuid(orgId)) return j({ error: "orgId inválido (esperado UUID)" }, 400);

    const sb = supabaseAdmin();
    // buscamos o secret apenas para computar secret_set, mas não retornamos o valor
    const { data, error } = await sb
      .from("shopee_credentials")
      .select("app_id, region, active, updated_at, secret")
      .eq("org_id", orgId)
      .maybeSingle();

    if (error) return j({ error: error.message }, 500);

    if (!data) return j({ credentials: null });

    const { secret, ...rest } = data;
    return j({
      credentials: {
        ...rest,
        secret_set: !!secret, // true/false para UI
      },
    });
  } catch (e: any) {
    return j({ error: String(e?.message || e) }, 400);
  }
}

/** PUT: salvar/atualizar credenciais da Shopee */
export async function PUT(req: NextRequest) {
  try {
    const { orgId } = getUserContext();
    if (!isUuid(orgId)) return j({ error: "orgId inválido (esperado UUID)" }, 400);

    const sb = supabaseAdmin();
    const body = await req.json().catch(() => ({} as any));
    const appId = String(body?.appId || "").trim();
    const secret = String(body?.secret || "").trim();
    const region = String(body?.region || "BR").trim().toUpperCase();
    const active = body?.active ?? true;

    if (!appId || !secret) {
      return j({ error: "appId e secret são obrigatórios" }, 400);
    }

    // (Opcional) verificação de existência da org
    const orgCheck = await sb.from("orgs").select("id").eq("id", orgId).maybeSingle();
    if (orgCheck.error) return j({ error: "Falha ao verificar orgs: " + orgCheck.error.message }, 500);
    if (!orgCheck.data) return j({ error: "Org inexistente: " + orgId }, 400);

    const upsert = {
      org_id: orgId,
      app_id: appId,
      secret, // guardado em texto; ideal: criptografar no futuro
      region,
      active,
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
