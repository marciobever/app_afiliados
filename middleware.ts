// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SESSION_COOKIE = "app_session";

// APIs públicas (não exigem login)
const PUBLIC_API = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/logout",
  "/api/dev/login",
  "/api/dev/seed-owner",
  "/api/health",
  "/api/dev/env-check",
];

// Páginas públicas (visíveis sem login)
const PUBLIC_PAGES = ["/", "/login", "/signup", "/privacy", "/terms"];

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname, searchParams } = url;

  // 0) Assets e arquivos estáticos liberados
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|css|js|map|txt|xml|json)$/i)
  ) {
    return NextResponse.next();
  }

  // 1) Endpoints de saúde liberados e rápidos (não tocar no "/")
  if (pathname === "/api/health" || pathname === "/health") {
    // deixe passar pro route handler (outra opção: responder aqui com 200)
    return NextResponse.next();
  }

  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  // 2) Se usuário já estiver logado e acessar /login ou /signup → redireciona
  if ((pathname === "/login" || pathname === "/signup") && hasSession) {
    const nextParam = searchParams.get("next");
    const redirectUrl = url.clone();
    redirectUrl.pathname = nextParam || "/dashboard/shopee";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  // 3) APIs públicas liberadas
  if (PUBLIC_API.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 4) Páginas públicas liberadas
  if (PUBLIC_PAGES.includes(pathname)) {
    return NextResponse.next();
  }

  // 5) Regras de auth
  const needsAuth =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api/") ||
    pathname === "/dashboard";

  if (!needsAuth) return NextResponse.next();

  if (hasSession) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const loginUrl = url.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

// Aplica globalmente (exceto estáticos e robots/sitemap)
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
