import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

// Apenas as ativas — bom para o n8n
export async function GET() {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("afiliados_ig_keywords")
    .select("keyword")
    .eq("active", true);

  if (error) return NextResponse.json({ keywords: [] });
  return NextResponse.json({ keywords: (data ?? []).map((r) => r.keyword) });
}
