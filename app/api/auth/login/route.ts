import { NextRequest, NextResponse } from "next/server";
import { createSessionCookie } from "@/lib/auth";
import { randomUUID, createHash } from "crypto";

/** Gera um UUID estável a partir de uma string (ex.: e-mail) */
function uuidFromString(input: string): string {
  const hex = createHash("sha256").update(input).digest("hex"); // 64 hex
  // monta como UUID v4-like a partir dos 32 primeiros hex
  const s = hex.slice(0, 32).split("");
  // versões/variantes válidas
  s[12] = "4";
  s[16] = (parseInt(s[16], 16) & 0x3 | 0x8).toString(16);
  return `${s.slice(0,8).join("")}-${s.slice(8,12).join("")}-${s.slice(12,16).join("")}-${s.slice(16,20).join("")}-${s.slice(20,32).join("")}`;
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

/**
 * LOGIN (temporário)
 * - Mantém sua UI atual.
 * - Gera sempre userId em formato UUID (sem prefixo "user:").
 * - Se o e-mail bater com ADMIN_EMAIL e houver ADMIN_USER_ID válido, usa-o.
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

    const email = (body.email ?? "").toString().trim().toLowerCase();
    const orgId = (body.orgId ?? "default").toString().trim();

    if (!email) {
      return NextResponse.json({ error: "E-mail é obrigatório" }, { status: 400 });
    }

    // Admin fixo (estável)
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase();
    const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

    let userId: string;

    if (ADMIN_EMAIL && ADMIN_USER_ID && email === ADMIN_EMAIL && isUuid(ADMIN_USER_ID)) {
      userId = ADMIN_USER_ID;
    } else {
      // UUID estável derivado do e-mail (não muda a cada login)
      userId = uuidFromString(email);
      // Se quiser IDs efêmeros, troque por: userId = randomUUID();
    }

    const res = NextResponse.json({ ok: true, userId, orgId });
    createSessionCookie(res as any, { userId, orgId });
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Erro no login" },
      { status: 400 }
    );
  }
}
