// app/api/meta/pages/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { getUserContext } from "@/lib/auth";

export async function GET() {
  try {
    const sess = getUserContext();
    if (!sess?.userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const sb = supabaseAdmin().schema("Produto_Afiliado");
    const { data, error } = await sb
      .from("social_integrations")
      .select("access_token")
      .eq("user_id", sess.userId)
      .eq("provider", "meta")
      .maybeSingle();

    if (error) {
      console.error("[/api/meta/pages] db_error:", error.message);
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }
    if (!data?.access_token) {
      return NextResponse.json({ error: "no_token" }, { status: 401 });
    }

    const token = data.access_token as string;
    const res = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account{id,username}&access_token=${encodeURIComponent(
        token
      )}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      let details: any = null;
      try {
        details = await res.json();
      } catch {}
      return NextResponse.json({ error: "graph_error", status: res.status, details }, { status: 502 });
    }

    const json = await res.json();
    return NextResponse.json(json);
  } catch (e: any) {
    console.error("[/api/meta/pages] error:", e?.message);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
