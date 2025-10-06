// app/api/meta/status/route.ts
import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { getUserContext } from "@/lib/auth";

export async function GET() {
  try {
    const { userId } = getUserContext();
    const sb = supabaseAdmin().schema("Produto_Afiliado");

    const { data, error } = await sb
      .from("social_integrations")
      .select("provider, access_token, expires_in, obtained_at, meta_user_id, granted_scopes")
      .eq("user_id", userId)
      .eq("provider", "meta")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ connected: false, error: error.message }, { status: 200 });
    }

    const connected = !!data?.access_token;
    return NextResponse.json({
      connected,
      meta_user_id: data?.meta_user_id ?? null,
      scopes: data?.granted_scopes ?? [],
      obtained_at: data?.obtained_at ?? null,
      expires_in: data?.expires_in ?? null,
    });
  } catch (e: any) {
    return NextResponse.json({ connected: false, error: e?.message || "auth_error" }, { status: 200 });
  }
}
