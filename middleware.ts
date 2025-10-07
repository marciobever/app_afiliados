// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SESSION_COOKIE = "app_session";

// APIs públicas (não exigem sessão)
const PUBLIC_API_PREFIXES = [
  "/api/auth/",     // login, signup, logout, callback…
  "/api/health",    // health-check
  "/api/dev/",      // endpoints de dev, se houver
  "/api/meta",      // OAuth Meta (start/callback)
  "/api/webhooks",  // webhooks (Meta/Outros)
];

// Páginas públicas do APP
const PUBLIC_PAGES = ["/login", "/signup"];

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname } = url;

  // liberar estáticos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|css|js|map|txt|xml|json)$/i)
  ) {
    return NextResponse.next();
  }

  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  // Home do APP: manda pro fluxo correto
  if (pathname === "/") {
    url.pathname = hasSession ? "/dashboard/shopee" : "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Logado tentando ir para /login ou /signup → vai pro dashboard
  if ((pathname === "/login" || pathname === "/signup") && hasSession) {
    const nextParam = req.nextUrl.searchParams.get("next");
    const to = req.nextUrl.clone();
    to.pathname = nextParam || "/dashboard/shopee";
    to.search = "";
    return NextResponse.redirect(to);
  }

  // APIs públicas liberadas
  if ( PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p)) ) {
    return NextResponse.next();
  }

  // Páginas públicas liberadas
  if ( PUBLIC_PAGES.includes(pathname) ) {
    return NextResponse.next();
  }

  // Protegidas: /dashboard/* e /api/* (o que não for público)
  const needsAuth =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api/");

  if (!needsAuth) {
    return NextResponse.next();
  }

  // Autenticado → ok
  if (hasSession) return NextResponse.next();

  // API protegida sem sessão → 401
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Página protegida sem sessão → login com next
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

// Aplica globalmente (exceto estáticos/arquivos públicos)
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};