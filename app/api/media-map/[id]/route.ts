// app/api/media-map/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

/**
 * PATCH /api/media-map/:id
 * body (opcional): { media_id?: string, product_url?: string }
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({} as any));
  const updates: Record<string, any> = {};
  if (body.media_id !== undefined) updates.media_id = body.media_id;
  if (body.product_url !== undefined) updates.product_url = body.product_url;

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("afiliados_media_map")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/**
 * DELETE /api/media-map/:id
 */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb = supabaseAdmin();
  const { error } = await sb.from("afiliados_media_map").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
