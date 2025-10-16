import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

// ATUALIZAR
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const updates: any = {};
  if (body.keyword !== undefined) updates.keyword = String(body.keyword).trim().toLowerCase();
  if (body.active !== undefined) updates.active = !!body.active;

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("afiliados_ig_keywords")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}

// DELETAR
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb = supabaseAdmin();
  const { error } = await sb.from("afiliados_ig_keywords").delete().eq("id", params.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
