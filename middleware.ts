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
const PUBLIC_PAGES = [
  "/", // landing principal
  "/login",
  "/signup",
  "/privacy",
  "/terms",
];

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // liberar assets estáticos e arquivos públicos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|css|js|map|txt|xml|json)$/i)
  ) {
    return NextResponse.next();
  }

  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  // 1) Se usuário já estiver logado e acessar /login ou /signup → redireciona pro dashboard
  if ((pathname === "/login" || pathname === "/signup") && hasSession) {
    const nextParam = searchParams.get("next");
    const url = req.nextUrl.clone();
    url.pathname = nextParam || "/dashboard/shopee";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // 2) APIs públicas liberadas
  if (PUBLIC_API.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 3) Páginas públicas liberadas
  if (PUBLIC_PAGES.includes(pathname)) {
    return NextResponse.next();
  }

  // 4) Verifica se rota requer autenticação
  const needsAuth =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api/") ||
    pathname === "/dashboard";

  if (!needsAuth) {
    // qualquer outra rota que não se encaixe acima segue pública
    return NextResponse.next();
  }

  // 5) Se o usuário tem sessão → ok
  if (hasSession) return NextResponse.next();

  // 6) APIs protegidas sem sessão → 401 JSON
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 7) Páginas protegidas sem sessão → redireciona p/ login
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

// Aplica globalmente (exceto estáticos)
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
