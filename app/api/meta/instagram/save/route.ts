// app/api/meta/instagram/save/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUserContext } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { userId } = getUserContext();
    const body = await req.json().catch(() => ({}));
    const { instagram_business_id, instagram_username, page_id, page_name } = body || {};

    if (!instagram_business_id || !/^[0-9]{5,20}$/.test(String(instagram_business_id))) {
      return NextResponse.json({ error: "instagram_business_id inválido" }, { status: 400 });
    }

    const sb = supabaseAdmin();
    const { error } = await sb
      .from("social_integrations")
      .update({
        instagram_business_id: String(instagram_business_id),
        instagram_username: instagram_username ?? null,
        page_id: page_id ?? null,
        page_name: page_name ?? null,
      })
      .eq("user_id", userId)
      .eq("provider", "meta");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, instagram_business_id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "unexpected_error" }, { status: 500 });
  }
}
