import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin"; // <- seu default export
import bcrypt from "bcryptjs";
import { createHash, randomUUID } from "crypto";
import { createSessionCookie } from "@/lib/auth";

function uuidFromString(input: string): string {
  const hex = createHash("sha256").update(input).digest("hex");
  const s = hex.slice(0, 32).split("");
  s[12] = "4";
  s[16] = ((parseInt(s[16], 16) & 0x3) | 0x8).toString(16);
  return `${s.slice(0,8).join("")}-${s.slice(8,12).join("")}-${s.slice(12,16).join("")}-${s.slice(16,20).join("")}-${s.slice(20,32).join("")}`;
}

const DEFAULT_ORG_ID = process.env.DEFAULT_ORG_ID || uuidFromString("default");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!name)   return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
    if (!email)  return NextResponse.json({ error: "E-mail é obrigatório." }, { status: 400 });
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Senha deve ter pelo menos 6 caracteres." }, { status: 400 });
    }

    // já existe?
    const { data: exists, error: existsErr } = await supabaseAdmin
      .from("app_users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existsErr) return NextResponse.json({ error: "Erro ao verificar usuário." }, { status: 500 });
    if (exists)    return NextResponse.json({ error: "E-mail já cadastrado." }, { status: 409 });

    const userId = randomUUID();
    const password_hash = await bcrypt.hash(password, 10);

    const { error: insertErr } = await supabaseAdmin
      .from("app_users")
      .insert({ id: userId, email, name, password_hash, is_active: true });

    if (insertErr) return NextResponse.json({ error: "Falha ao criar usuário." }, { status: 500 });

    const res = NextResponse.json({ ok: true, userId, orgId: DEFAULT_ORG_ID });
    createSessionCookie(res as any, { userId, orgId: DEFAULT_ORG_ID });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro no cadastro." }, { status: 400 });
  }
}
