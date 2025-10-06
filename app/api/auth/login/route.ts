// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { createSessionCookie } from "@/lib/auth";
import { getOrCreatePrimaryOrg } from "@/lib/orgs";

/** UUID determinístico (usado só como fallback em dev/admin) */
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
// (Somente fallback dev – não usamos em user normal agora)
const DEFAULT_ORG_ID = process.env.DEFAULT_ORG_ID || uuidFromString("default");

export async function POST(req: NextRequest) {
  try {
    // --- parse body seguro (json / form / fallback) ---
    const ctype = (req.headers.get("content-type") || "").toLowerCase();
    let body: Record<string, any> = {};

    if (ctype.includes("application/json")) {
      body = await req.json().catch(() => ({}));
    } else if (ctype.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData();
      body = Object.fromEntries(form.entries());
    } else {
      body = await req.json().catch(() => ({}));
    }

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email)  return NextResponse.json({ error: "E-mail é obrigatório" }, { status: 400 });
    if (!password) return NextResponse.json({ error: "Senha é obrigatória" }, { status: 400 });

    // --- atalho ADMIN (se definido via env) ---
    const isAdmin =
      !!ADMIN_EMAIL &&
      !!ADMIN_USER_ID &&
      email === ADMIN_EMAIL &&
      UUID_RX.test(ADMIN_USER_ID);

    if (isAdmin) {
      const adminOrg =
        (ADMIN_ORG_ID && UUID_RX.test(ADMIN_ORG_ID) && ADMIN_ORG_ID) || ADMIN_USER_ID;

      const res = NextResponse.json({
        ok: true,
        userId: ADMIN_USER_ID,
        orgId: adminOrg,
        email,
        isAdmin: true,
      });
      createSessionCookie(res as any, { userId: ADMIN_USER_ID!, orgId: adminOrg! });
      return res;
    }

    // --- login de usuário "normal" (tabela app_users) ---
    const sb = supabaseAdmin().schema("Produto_Afiliado");

    const { data: user, error } = await sb
      .from("app_users")
      .select("id, email, name, password_hash, is_active")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("[/api/auth/login] select app_users error:", error.message);
      return NextResponse.json({ error: "Erro ao buscar usuário." }, { status: 500 });
    }
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }
    if (user.is_active === false) {
      return NextResponse.json({ error: "Conta desativada." }, { status: 403 });
    }

    const hash = String(user.password_hash ?? "");
    const ok = hash && (await bcrypt.compare(password, hash));
    if (!ok) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    // Multi-tenant: pega (ou cria) a org principal do usuário
    const { orgId, org } = await getOrCreatePrimaryOrg(user.id, user.email);

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
    console.error("[/api/auth/login] error:", e?.message);
    return NextResponse.json({ error: e?.message || "Erro no login" }, { status: 400 });
  }
}
