// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import bcrypt from "bcryptjs";
import { createSessionCookie } from "@/lib/auth";
import { getOrCreatePrimaryOrg } from "@/lib/orgs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const name = String(body.name ?? "").trim();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "E-mail e senha obrigatórios" }, { status: 400 });
    }

    const sb = supabaseAdmin().schema("Produto_Afiliado");

    // já existe?
    const { data: exists, error: existsErr } = await sb
      .from("app_users")
      .select("id, is_active")
      .eq("email", email)
      .maybeSingle();
    if (existsErr) throw existsErr;
    if (exists) {
      return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 10);

    // cria usuário
    const { data: user, error: uErr } = await sb
      .from("app_users")
      .insert({ email, name: name || null, password_hash, is_active: true })
      .select("id, email, name")
      .single();
    if (uErr) throw uErr;

    // cria/recupera org principal e vínculo (owner)
    const { orgId, org } = await getOrCreatePrimaryOrg(user.id, user.email);

    // emite sessão
    const res = NextResponse.json({
      ok: true,
      userId: user.id,
      orgId,
      email: user.email,
      name: user.name ?? null,
      org,
    });
    createSessionCookie(res as any, { userId: user.id, orgId });
    return res;
  } catch (e: any) {
    console.error("[/api/auth/signup] error:", e?.message);
    return NextResponse.json({ error: e?.message || "internal" }, { status: 500 });
  }
}
