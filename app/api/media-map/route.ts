// app/api/media-map/route.ts
import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

/**
 * GET /api/media-map?mediaId=179...
 * Lista mapeamentos (filtra por mediaId se enviado)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mediaId = searchParams.get("mediaId") || undefined;

  const sb = supabaseAdmin();
  let q = sb
    .from("afiliados_media_map")
    .select("*")
    .order("data_criacao", { ascending: false })
    .limit(200);

  if (mediaId) q = q.eq("media_id", mediaId);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/**
 * POST /api/media-map
 * body: { media_id: string, product_url: string }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  const { media_id, product_url } = body || {};

  if (!media_id || !product_url) {
    return NextResponse.json(
      { error: "Campos obrigatórios: media_id, product_url" },
      { status: 400 }
    );
  }

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("afiliados_media_map")
    .insert([{ media_id, product_url }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
