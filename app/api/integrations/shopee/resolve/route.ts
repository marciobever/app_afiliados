import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || "";

export async function POST(req: NextRequest) {
  // valida o token interno enviado pelo cliente (ex: n8n)
  const auth = req.headers.get("x-internal-token") || "";
  if (!INTERNAL_TOKEN || auth !== INTERNAL_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // lê o orgId do corpo da requisição
  const { orgId } = await req.json().catch(() => ({}));
  if (!orgId) {
    return NextResponse.json({ error: "orgId required" }, { status: 400 });
  }

  const sb = supabaseAdmin();

  // busca credenciais no Supabase
  const { data, error } = await sb
    .from("shopee_credentials")
    .select("app_id, secret, region, active")
    .eq("org_id", orgId)
    .maybeSingle();

  if (error) {
    console.error("[resolve/route] supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || !data.active) {
    return NextResponse.json({ error: "credentials_not_found" }, { status: 404 });
  }

  // retorno padronizado
  return NextResponse.json({
    appId: data.app_id,
    secret: data.secret,
    region: data.region || "BR",
  });
}