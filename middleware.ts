// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SESSION_COOKIE = "app_session";

const PUBLIC = [
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/dev/login",
  "/api/dev/seed-owner",
  "/api/health",
];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // liberar assets estáticos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|css|js|map)$/i)
  ) {
    return NextResponse.next();
  }

  // liberar rotas públicas
  if (PUBLIC.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // precisa de sessão nessas rotas
  const needsAuth =
    pathname.startsWith("/api/") ||
    pathname === "/" ||
    pathname.startsWith("/dashboard/");

  if (!needsAuth) return NextResponse.next();

  const hasSession = !!req.cookies.get(SESSION_COOKIE)?.value;
  if (hasSession) return NextResponse.next();

  // API sem sessão -> 401
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Página sem sessão -> redireciona
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = ""; // reconstroi `next` limpo
  url.searchParams.set("next", pathname + (search || ""));
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};