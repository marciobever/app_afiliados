// app/api/integrations/shopee/subids/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function j(data:any, status=200){ return NextResponse.json(data,{status}); }
function norm(list:any): string[] {
  const arr = Array.isArray(list) ? list : String(list || '')
    .split(/[,\n;]/).map(s=>s.trim()).filter(Boolean);
  // Shopee aceita no máx. 5 subIds
  return arr.slice(0,5);
}

export async function GET() {
  try {
    const { orgId } = getUserContext();
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("shopee_subids")
      .select("subids, updated_at")
      .eq("org_id", orgId)
      .maybeSingle();
    if (error) return j({ error: error.message }, 500);
    return j({ subids: data?.subids ?? [] });
  } catch(e:any) { return j({ error: String(e?.message || e) }, 400); }
}

export async function PUT(req: NextRequest) {
  try {
    const { orgId } = getUserContext();
    const body = await req.json().catch(()=>({}));
    const subids = norm(body.subids);

    const sb = supabaseAdmin();
    const { error } = await sb
      .from("shopee_subids")
      .upsert({ org_id: orgId, subids, updated_at: new Date().toISOString() }, { onConflict: "org_id" });
    if (error) return j({ error: error.message }, 500);

    return j({ ok: true, subids });
  } catch(e:any) { return j({ error: String(e?.message || e) }, 400); }
}
