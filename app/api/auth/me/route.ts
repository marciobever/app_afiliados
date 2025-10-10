// app/api/auth/me/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { getUserContext, clearSessionCookie } from "@/lib/auth";

const ALLOWED_ORIGINS = [
  "https://seureview.com.br",
  "https://www.seureview.com.br",
  process.env.NEXT_PUBLIC_SITE_URL || "", // se você tiver essa env
  process.env.NEXT_PUBLIC_APP_URL || "",  // não precisa, mas não atrapalha
].filter(Boolean);

function withCORS(res: NextResponse) {
  const h = nextHeaders();
  const origin = h.get("origin") || "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin); // credenciais exigem echo do origin
    res.headers.set("Vary", "Origin");
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  return res;
}

export async function OPTIONS() {
  return withCORS(NextResponse.json({ ok: true }));
}

export async function GET() {
  try {
    const sess = getUserContext(); // { userId, orgId }
    if (!sess?.userId) {
      return withCORS(NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 }));
    }

    const sb = supabaseAdmin().schema("Produto_Afiliado");
    const { data: profile, error } = await sb
      .from("app_users")
      .select("id, email, name, is_active")
      .eq("id", sess.userId)
      .maybeSingle();

    if (error) {
      console.error("[/api/auth/me] db_error:", error.message);
      return withCORS(NextResponse.json({ ok: false, error: "db_error" }, { status: 500 }));
    }

    return withCORS(NextResponse.json({ ok: true, session: sess, profile }));
  } catch (e: any) {
    console.error("[/api/auth/me] error:", e?.message);
    return withCORS(NextResponse.json({ ok: false, error: "internal" }, { status: 500 }));
  }
}

// Opcional: logout via DELETE /api/auth/me
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res as any);
  return withCORS(res);
}
