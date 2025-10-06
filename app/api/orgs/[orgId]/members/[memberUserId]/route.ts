// app/api/orgs/[orgId]/members/[memberUserId]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { getUserContext } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgId: string; memberUserId: string } }
) {
  const { orgId, memberUserId } = params;

  const { userId } = getUserContext();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // TODO: validar permissão owner/admin

  const { role } = await req.json().catch(() => ({}));
  if (!role) {
    return NextResponse.json({ error: "role é obrigatório" }, { status: 400 });
  }

  const sb = supabaseAdmin().schema("Produto_Afiliado");
  const { error } = await sb
    .from("org_users")
    .update({ role })
    .eq("org_id", orgId)
    .eq("user_id", memberUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { orgId: string; memberUserId: string } }
) {
  const { orgId, memberUserId } = params;

  const { userId } = getUserContext();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // TODO: validar permissão owner/admin

  const sb = supabaseAdmin().schema("Produto_Afiliado");
  const { error } = await sb
    .from("org_users")
    .delete()
    .eq("org_id", orgId)
    .eq("user_id", memberUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
