// app/api/auth/logout/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";

const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined; // ex.: .seureview.com.br
const DEFAULT_NEXT = process.env.NEXT_PUBLIC_SITE_URL || "https://seureview.com.br";

// nomes antigos/novos para garantir limpeza total
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

function clearAllCookies(res: NextResponse) {
  for (const name of COOKIES) {
    expireCookie(res, name); // host atual
    if (COOKIE_DOMAIN) expireCookie(res, name, COOKIE_DOMAIN); // domínio raiz
  }
  res.headers.set("Cache-Control", "no-store");
}

/** Garante que só redirecionamos para domínios nossos e escolhe um fallback. */
function safeNext(url?: string) {
  try {
    const u = url ? new URL(url) : new URL(DEFAULT_NEXT);
    const allowed = [
      "seureview.com.br",
      "www.seureview.com.br",
      "app.seureview.com.br",
    ];
    if (allowed.some(h => u.hostname === h || u.hostname.endsWith(h))) {
      return u.toString();
    }
  } catch {}
  return DEFAULT_NEXT;
}

export async function GET(req: NextRequest) {
  const next = safeNext(req.nextUrl.searchParams.get("next") || DEFAULT_NEXT);
  const res = NextResponse.redirect(next, { status: 302 });
  clearAllCookies(res);
  return res;
}

// Mantém POST retornando JSON (para chamadas programáticas dentro do app),
// mas se pedirem HTML, redireciona também.
export async function POST(req: NextRequest) {
  const wantsHtml = (req.headers.get("accept") || "").includes("text/html");
  const next = safeNext(req.nextUrl.searchParams.get("next") || DEFAULT_NEXT);

  if (wantsHtml) {
    const res = NextResponse.redirect(next, { status: 302 });
    clearAllCookies(res);
    return res;
  }

  const res = NextResponse.json({ ok: true });
  clearAllCookies(res);
  return res;
}
