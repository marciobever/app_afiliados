export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUserContext } from "@/lib/auth";

function j(res: any, status = 200) {
  return NextResponse.json(res, { status });
}

async function ensureOrg(sb: ReturnType<typeof supabaseAdmin>, orgId: string) {
  const { data, error } = await sb.from("orgs").select("id").eq("id", orgId).maybeSingle();
  if (error) throw new Error(`Falha ao verificar orgs: ${error.message}`);
  if (!data) {
    const { error: insErr } = await sb.from("orgs").insert({ id: orgId, name: "default" });
    if (insErr) throw new Error(`Falha ao criar org: ${insErr.message}`);
  }
}

// GET: devolve os subids como objeto
export async function GET() {
  try {
    const { orgId } = getUserContext();
    const sb = supabaseAdmin();
    await ensureOrg(sb, orgId);

    const { data, error } = await sb
      .from("shopee_subids")
      .select("subids, updated_at")
      .eq("org_id", orgId)
      .maybeSingle();

    if (error) return j({ error: error.message }, 500);
    return j({
      subids: data?.subids ?? {
        main_channel: "",
        sub_channel: "",
        extra_1: "",
        extra_2: "",
      },
      updated_at: data?.updated_at ?? null
    });
  } catch (e: any) {
    return j({ error: String(e?.message || e) }, 400);
  }
}

// PUT: salva/atualiza subids (jsonb)
export async function PUT(req: NextRequest) {
  try {
    const { orgId } = getUserContext();
    const sb = supabaseAdmin();
    await ensureOrg(sb, orgId);

    const body = await req.json().catch(() => ({} as any));
    const {
      main_channel = "",
      sub_channel = "",
      extra_1 = "",
      extra_2 = "",
    } = body || {};

    const upsert = {
      org_id: orgId,
      subids: {
        main_channel: String(main_channel || ""),
        sub_channel: String(sub_channel || ""),
        extra_1: String(extra_1 || ""),
        extra_2: String(extra_2 || "")
      },
      updated_at: new Date().toISOString(),
    };

    const { error } = await sb
      .from("shopee_subids")
      .upsert(upsert, { onConflict: "org_id" });

    if (error) return j({ error: error.message }, 500);
    return j({ ok: true });
  } catch (e: any) {
    return j({ error: String(e?.message || e) }, 400);
  }
}
