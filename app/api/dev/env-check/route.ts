// app/api/dev/env-check/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redact(v?: string | null, keepStart = 6, keepEnd = 4) {
  if (!v) return "";
  const s = String(v).trim();
  if (s.length <= keepStart + keepEnd) return "****";
  return `${s.slice(0, keepStart)}…${s.slice(-keepEnd)}`;
}

export async function GET() {
  const SUPABASE_URL = (process.env.SUPABASE_URL || "").trim();
  const NEXT_PUBLIC_SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const NEXT_PUBLIC_SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const DATABASE_URL = (process.env.DATABASE_URL || "").trim();
  const COOKIE_DOMAIN = (process.env.COOKIE_DOMAIN || "").trim();

  // Validações simples (sem vazar segredo)
  const urlRx = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i;
  const dbRx = /^postgresql:\/\/postgres:.*@db\.[a-z0-9-]+\.supabase\.co:5432\/postgres\?sslmode=require$/i;
  const jwtLike = (k: string) => k.includes(".") && k.split(".").length >= 3 && k.length > 40;

  const checks = {
    supabaseUrl_ok: urlRx.test(SUPABASE_URL),
    nextPublicUrl_match: NEXT_PUBLIC_SUPABASE_URL === SUPABASE_URL && urlRx.test(NEXT_PUBLIC_SUPABASE_URL),
    anonKey_present: Boolean(NEXT_PUBLIC_SUPABASE_ANON_KEY),
    anonKey_format_ok: jwtLike(NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRole_present: Boolean(SUPABASE_SERVICE_ROLE_KEY),
    serviceRole_format_ok: jwtLike(SUPABASE_SERVICE_ROLE_KEY),
    databaseUrl_ok: dbRx.test(DATABASE_URL),
    cookieDomain_ok: COOKIE_DOMAIN ? true : false,
  };

  const info = {
    SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL,
    DATABASE_URL_example_host: DATABASE_URL.split("@")[1]?.split("/")[0] || "",
    COOKIE_DOMAIN,
    anonKey_preview: redact(NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRole_preview: redact(SUPABASE_SERVICE_ROLE_KEY),
  };

  return NextResponse.json({ ok: Object.values(checks).every(Boolean), checks, info });
}
