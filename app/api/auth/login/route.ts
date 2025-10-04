// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSessionCookie } from "@/lib/auth";
import { createHash } from "crypto";

/** UUID determinístico a partir de string */
function uuidFromString(input: string): string {
  const hex = createHash("sha256").update(input).digest("hex");
  const s = hex.slice(0, 32).split("");
  s[12] = "4";
  s[16] = ((parseInt(s[16], 16) & 0x3) | 0x8).toString(16);
  return `${s.slice(0,8).join("")}-${s.slice(8,12).join("")}-${s.slice(12,16).join("")}-${s.slice(16,20).join("")}-${s.slice(20,32).join("")}`;
}
const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase();
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
const ADMIN_ORG_ID = process.env.ADMIN_ORG_ID; // opcional

// use um UUID fixo para a org “default”
const DEFAULT_ORG_ID = process.env.DEFAULT_ORG_ID || uuidFromString("default");

export async function POST(req: NextRequest) {
  try {
    const ctype = req.headers.get("content-type") || "";
    let body: Record<string, any> = {};

    if (ctype.includes("application/json")) body = await req.json().catch(() => ({}));
    else if (ctype.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData();
      body = Object.fromEntries(form.entries());
    } else {
      body = await req.json().catch(() => ({}));
    }

    const email = (body.email ?? "").toString().trim().toLowerCase();
    let orgIdIn = (body.orgId ?? "default").toString().trim();

    if (!email) {
      return NextResponse.json({ error: "E-mail é obrigatório" }, { status: 400 });
    }

    // userId UUID estável por e-mail (ou admin fixo, se definido)
    const isAdmin = ADMIN_EMAIL && ADMIN_USER_ID && email === ADMIN_EMAIL && UUID_RX.test(ADMIN_USER_ID);
    const userId = isAdmin ? (ADMIN_USER_ID as string) : uuidFromString(email);

    // orgId precisa ser UUID (usa ADMIN_ORG_ID se admin; senão DEFAULT_ORG_ID; se veio um UUID válido, respeita)
    let orgId =
      (isAdmin && ADMIN_ORG_ID && UUID_RX.test(ADMIN_ORG_ID) && ADMIN_ORG_ID) ||
      (UUID_RX.test(orgIdIn) ? orgIdIn : DEFAULT_ORG_ID);

    const res = NextResponse.json({ ok: true, userId, orgId });
    createSessionCookie(res as any, { userId, orgId });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro no login" }, { status: 400 });
  }
}
