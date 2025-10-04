// app/api/meta/pages/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUserContext } from "@/lib/auth";

export async function GET() {
  const { userId } = getUserContext();
  const sb = supabaseAdmin();

  const { data, error } = await sb
    .from("social_integrations")
    .select("access_token")
    .eq("user_id", userId)
    .eq("provider", "meta")
    .maybeSingle();

  if (error || !data?.access_token)
    return NextResponse.json({ error: "no_token" }, { status: 401 });

  const token = data.access_token as string;

  const res = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account{id,username}&access_token=${encodeURIComponent(
      token
    )}`
  );

  const json = await res.json();
  return NextResponse.json(json);
}
