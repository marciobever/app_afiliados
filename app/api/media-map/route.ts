// app/api/media-map/route.ts
import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mediaId = searchParams.get("mediaId") || undefined;

  let q = supabaseAdmin.from("afiliados_media_map").select("*").order("data_criacao", { ascending: false }).limit(200);
  if (mediaId) q = q.eq("media_id", mediaId);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { media_id, product_url } = body || {};
  if (!media_id || !product_url) {
    return NextResponse.json({ error: "Campos obrigatórios: media_id, product_url" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("afiliados_media_map")
    .insert([{ media_id, product_url }])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
