// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { getUserContext, clearSessionCookie } from "@/lib/auth";

// Retorna dados básicos da sessão + perfil do usuário
export async function GET() {
  const sess = getUserContext(); // { userId, orgId } ou { userId:null, orgId:null }

  if (!sess.userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabaseAdmin
    .from("app_users")
    .select("id, email, name, is_active")
    .eq("id", sess.userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, session: sess, profile });
}

// Opcional: logout via DELETE /api/auth/me
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res as any);
  return res;
}
