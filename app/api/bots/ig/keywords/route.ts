import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

// LISTAR
export async function GET() {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("afiliados_ig_keywords")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}

// CRIAR
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const raw = String(body?.keyword || "").trim();
  if (!raw) return NextResponse.json({ ok: false, error: "keyword obrigatória" }, { status: 400 });

  const keyword = raw.toLowerCase();
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("afiliados_ig_keywords")
    .insert([{ keyword }])
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data }, { status: 201 });
}
