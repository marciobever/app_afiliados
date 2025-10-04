import { NextRequest, NextResponse } from "next/server";
import { createSessionCookie } from "@/lib/auth";

/**
 * LOGIN (temporário)
 * - Mantém sua UI atual. O form da página deve POSTar pra /api/auth/login
 * - Por enquanto não valida senha (stub). Integração real vem depois.
 * - Aceita JSON ou form-urlencoded.
 */
export async function POST(req: NextRequest) {
  try {
    const ctype = req.headers.get("content-type") || "";
    let body: Record<string, any> = {};

    if (ctype.includes("application/json")) {
      body = await req.json().catch(() => ({}));
    } else if (ctype.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData();
      body = Object.fromEntries(form.entries());
    } else {
      body = await req.json().catch(() => ({}));
    }

    const email = (body.email ?? "").toString().trim();
    const orgId = (body.orgId ?? "default").toString().trim();

    if (!email) {
      return NextResponse.json({ error: "E-mail é obrigatório" }, { status: 400 });
    }

    // TODO: substituir por validação real (DB) quando for ligar credenciais
    const userId = `user:${email}`;

    const res = NextResponse.json({ ok: true, userId, orgId });
    // seta cookie de sessão na resposta (sem await)
    createSessionCookie(res as any, { userId, orgId });
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Erro no login" },
      { status: 400 }
    );
  }
}