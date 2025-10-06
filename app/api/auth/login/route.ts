import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { createSessionCookie } from "@/lib/auth";

function uuidFromString(input: string): string {
  const hex = createHash("sha256").update(input).digest("hex");
  const s = hex.slice(0, 32).split("");
  s[12] = "4";
  s[16] = ((parseInt(s[16], 16) & 0x3) | 0x8).toString(16);
  return `${s.slice(0,8).join("")}-${s.slice(8,12).join("")}-${s.slice(12,16).join("")}-${s.slice(16,20).join("")}-${s.slice(20,32).join("")}`;
}

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ADMIN_EMAIL   = process.env.ADMIN_EMAIL?.toLowerCase();
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
const ADMIN_ORG_ID  = process.env.ADMIN_ORG_ID;
const DEFAULT_ORG_ID = process.env.DEFAULT_ORG_ID || uuidFromString("default");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email)    return NextResponse.json({ error: "E-mail é obrigatório" }, { status: 400 });
    if (!password) return NextResponse.json({ error: "Senha é obrigatória" }, { status: 400 });

    // atalho admin (se definido via env)
    const isAdmin = ADMIN_EMAIL && ADMIN_USER_ID && email === ADMIN_EMAIL && UUID_RX.test(ADMIN_USER_ID);
    if (isAdmin) {
      const res = NextResponse.json({ ok: true, userId: ADMIN_USER_ID, orgId: ADMIN_ORG_ID || DEFAULT_ORG_ID });
      createSessionCookie(res as any, { userId: ADMIN_USER_ID!, orgId: ADMIN_ORG_ID || DEFAULT_ORG_ID });
      return res;
    }

    // busca usuário
    const { data: user, error } = await supabaseAdmin
      .from("app_users")
      .select("id, password_hash, is_active")
      .eq("email", email)
      .maybeSingle();

    if (error)      return NextResponse.json({ error: "Erro ao buscar usuário." }, { status: 500 });
    if (!user)      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    if (user.is_active === false) {
      return NextResponse.json({ error: "Conta desativada." }, { status: 403 });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });

    const res = NextResponse.json({ ok: true, userId: user.id, orgId: DEFAULT_ORG_ID });
    createSessionCookie(res as any, { userId: user.id, orgId: DEFAULT_ORG_ID });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro no login" }, { status: 400 });
  }
}
