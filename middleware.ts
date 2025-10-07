// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SESSION_COOKIE = "app_session";

const PUBLIC_API_PREFIXES = [
  "/api/auth/",
  "/api/health",
  "/api/dev/",
  "/api/meta",
  "/api/webhooks",
];

const PUBLIC_PAGES = ["/login", "/signup"];

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname } = url;

  // estáticos liberados
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|css|js|map|txt|xml|json)$/i)
  ) {
    return NextResponse.next();
  }

  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  // raiz -> dashboard ou login
  if (pathname === "/") {
    url.pathname = hasSession ? "/dashboard" : "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // logado tentando /login|/signup -> dashboard (ou next=?)
  if ((pathname === "/login" || pathname === "/signup") && hasSession) {
    const nextParam = req.nextUrl.searchParams.get("next");
    const to = req.nextUrl.clone();
    to.pathname = nextParam || "/dashboard";
    to.search = "";
    return NextResponse.redirect(to);
  }

  // APIs públicas
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // páginas públicas
  if (PUBLIC_PAGES.includes(pathname)) {
    return NextResponse.next();
  }

  // protegidas
  const needsAuth =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api/");

  if (!needsAuth) return NextResponse.next();

  if (hasSession) return NextResponse.next();

  // API protegida sem sessão
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // página protegida sem sessão -> login
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
