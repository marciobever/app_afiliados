// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SESSION_COOKIE = "app_session";

// Rotas de API públicas
const PUBLIC_API = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/dev/login",
  "/api/dev/seed-owner",
  "/api/health",
];

// Páginas públicas do site (landing e institucionais)
const PUBLIC_PAGES = [
  "/",            // landing em app/(site)/page.tsx
  "/login",       // página de login é pública (mas se logado, redireciona)
  "/signup",
  "/privacy",
  "/terms",
];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Liberar assets estáticos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|css|js|map|txt|xml)$/i)
  ) {
    return NextResponse.next();
  }

  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  // Se usuário já está logado e acessa /login, manda para o dashboard (ou `next`)
  if (pathname === "/login" && hasSession) {
    const url = req.nextUrl.clone();
    const nextParam = req.nextUrl.searchParams.get("next");
    url.pathname = nextParam || "/dashboard/shopee";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // APIs públicas
  if (PUBLIC_API.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Páginas públicas (landing e afins)
  if (PUBLIC_PAGES.includes(pathname)) {
    return NextResponse.next();
  }

  // Regras de proteção:
  // - Tudo em /dashboard/** requer sessão
  // - Qualquer /api/** (que não esteja na lista pública) requer sessão
  const needsAuth =
    pathname.startsWith("/dashboard/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/api/");

  if (!needsAuth) {
    // Outras rotas não listadas acima ficam públicas por padrão
    return NextResponse.next();
  }

  // Se tem sessão, segue
  if (hasSession) return NextResponse.next();

  // API sem sessão -> 401
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Página sem sessão -> redireciona para /login com `next`
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", pathname + (search || ""));
  return NextResponse.redirect(url);
}

export const config = {
  // Aplica em tudo, exceto estáticos básicos (redundante com os ifs, mas melhora performance)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
