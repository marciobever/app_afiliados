// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { readSessionCookie, clearSessionCookie } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const sess = readSessionCookie(req);
  if (!sess?.userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: user } = await supabaseAdmin
    .from("app_users")
    .select("id, email, is_active")
    .eq("id", sess.userId)
    .maybeSingle();

  if (!user || user.is_active === false) {
    const res = NextResponse.json({ error: "invalid_session" }, { status: 401 });
    clearSessionCookie(res as any);
    return res;
  }

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, is_active: user.is_active },
    orgId: sess.orgId,
  });
}
