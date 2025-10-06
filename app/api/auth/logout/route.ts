// app/api/auth/logout/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";

const SESSION_COOKIE = "app_session";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

function expireCookie(res: NextResponse, domain?: string) {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
    ...(domain ? { domain } : {}),
  });
}

export async function POST() {
  // JSON de sucesso + limpa cookie com e sem domain
  const res = NextResponse.json({ ok: true });

  // tenta limpar na raíz do host atual
  expireCookie(res);
  // tenta limpar também no domínio configurado (ex.: .seureview.com.br)
  if (COOKIE_DOMAIN) expireCookie(res, COOKIE_DOMAIN);

  // opcional: redirecionar já daqui (descomente se preferir)
  // return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "https://app.seureview.com.br"));

  return res;
}
