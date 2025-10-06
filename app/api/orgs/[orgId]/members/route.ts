// app/api/orgs/[orgId]/members/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { getUserContext } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  const { orgId } = params;

  const sb = supabaseAdmin().schema("Produto_Afiliado");
  const { data, error } = await sb
    .from("org_users")
    .select("user_id, role, created_at")
    .eq("org_id", orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ members: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  const { orgId } = params;

  const { userId } = getUserContext();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // TODO: validar se userId tem permissão (owner/admin) nessa orgId

  const { memberUserId, role } = await req.json().catch(() => ({} as any));
  if (!memberUserId) {
    return NextResponse.json(
      { error: "memberUserId é obrigatório" },
      { status: 400 }
    );
  }

  const sb = supabaseAdmin().schema("Produto_Afiliado");
  const { error } = await sb
    .from("org_users")
    .upsert(
      { org_id: orgId, user_id: memberUserId, role: role || "member" },
      { onConflict: "org_id,user_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
