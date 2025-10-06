// app/api/auth/logout/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";

const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

// nomes antigos/novos (para garantir limpeza total)
const COOKIES = ["app_session", "srv_sess"];

function expireCookie(res: NextResponse, name: string, domain?: string) {
  res.cookies.set(name, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
    ...(domain ? { domain } : {}),
  });
}

export async function POST() {
  const res = NextResponse.json({ ok: true });

  for (const name of COOKIES) {
    expireCookie(res, name);                 // host atual
    if (COOKIE_DOMAIN) expireCookie(res, name, COOKIE_DOMAIN); // domínio raiz
  }

  // Se preferir sair para /login imediatamente:
  // return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "/"));

  return res;
}
