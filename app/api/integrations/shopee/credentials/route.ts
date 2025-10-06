export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { getUserContext } from "@/lib/auth";

const SB = () => supabaseAdmin().schema("Produto_Afiliado");
const MISSING =
  /(schema cache)|(does not exist)|relation .* does not exist|not find the table/i;

const j = (data: any, status = 200) => NextResponse.json(data, { status });

// — garante que a org existe no **schema Produto_Afiliado** (não no public)
async function ensureOrg(orgId: string) {
  const sb = SB();
  const r = await sb.from("orgs").select("id").eq("id", orgId).maybeSingle();
  if (r.error) {
    // se schema/tabela ainda não expostos, não quebra a tela
    if (MISSING.test(r.error.message || "")) return;
    throw new Error(`Falha ao verificar orgs: ${r.error.message}`);
  }
  if (!r.data) {
    // cria silenciosamente (idempotente)
    await sb
      .from("orgs")
      .insert({
        id: orgId,
        name: "Default",
        slug: `org-${orgId.slice(0, 8)}`,
      })
      .select("id")
      .single()
      .catch(() => undefined);
  }
}

// GET: carrega credenciais (NÃO retorna secret)
export async function GET() {
  try {
    const { orgId } = getUserContext();
    if (!orgId) return j({ error: "unauthorized" }, 401);

    await ensureOrg(orgId);

    const r = await SB()
      .from("shopee_credentials")
      .select("app_id, region, active, updated_at")
      .eq("org_id", orgId)
      .maybeSingle();

    if (r.error) {
      if (MISSING.test(r.error.message || "")) {
        return j({ credentials: null, fallback: true });
      }
      return j({ error: r.error.message }, 500);
    }

    return j({ credentials: r.data || null });
  } catch (e: any) {
    return j({ error: e?.message || String(e) }, 500);
  }
}

// PUT: cria/atualiza credenciais em Produto_Afiliado.shopee_credentials
export async function PUT(req: NextRequest) {
  try {
    const { orgId } = getUserContext();
    if (!orgId) return j({ error: "unauthorized" }, 401);

    await ensureOrg(orgId);

    const body = (await req.json().catch(() => ({}))) as any;
    const appId = body.appId ? String(body.appId).trim() : "";
    const region = (body.region ? String(body.region) : "BR").toUpperCase();
    const active = Boolean(body.active ?? true);

    // Se `secret` vier vazio/omitido, NÃO sobrescreve o que já existe
    const secretProvided =
      body.secret !== undefined &&
      body.secret !== null &&
      String(body.secret).trim() !== "";

    if (!appId && !secretProvided) {
      return j({ error: "appId ou secret obrigatórios" }, 400);
    }

    const payload: any = {
      org_id: orgId,
      app_id: appId,
      region,
      active,
      updated_at: new Date().toISOString(),
    };
    if (secretProvided) payload.secret = String(body.secret);

    const r = await SB()
      .from("shopee_credentials")
      .upsert(payload, { onConflict: "org_id" })
      .select("app_id, region, active")
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

    return j({ ok: true, credentials: r.data });
  } catch (e: any) {
    return j({ error: e?.message || String(e) }, 500);
  }
}
