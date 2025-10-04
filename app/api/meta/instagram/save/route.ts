// app/api/meta/instagram/save/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUserContext } from "@/lib/auth";

async function fetchUserPages(token: string) {
  const url = new URL("https://graph.facebook.com/v23.0/me/accounts");
  url.search = new URLSearchParams({
    fields: "id,name,instagram_business_account{id,username}",
    access_token: token,
  }).toString();

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`graph_error ${res.status}`);
  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : [];
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getUserContext();
    const body = await req.json().catch(() => ({}));
    const { instagram_business_id, instagram_username, page_id, page_name } = body || {};

    if (!instagram_business_id || !/^[0-9]{5,20}$/.test(String(instagram_business_id))) {
      return NextResponse.json({ error: "instagram_business_id inválido" }, { status: 400 });
    }

    const sb = supabaseAdmin();
    // pega o token salvo
    const { data: row, error: qErr } = await sb
      .from("social_integrations")
      .select("access_token")
      .eq("user_id", userId)
      .eq("provider", "meta")
      .single();

    if (qErr || !row?.access_token) {
      return NextResponse.json({ error: "no_token" }, { status: 401 });
    }

    // valida se o IG ID pertence a alguma página do usuário
    const pages = await fetchUserPages(row.access_token);
    const match = pages.find((p: any) => p?.instagram_business_account?.id == String(instagram_business_id));

    if (!match) {
      return NextResponse.json({ error: "instagram_id_not_owned" }, { status: 403 });
    }

    const payload = {
      instagram_business_id: String(instagram_business_id),
      instagram_username: instagram_username ?? match?.instagram_business_account?.username ?? null,
      page_id: page_id ?? match?.id ?? null,
      page_name: page_name ?? match?.name ?? null,
    };

    const { error: upErr } = await sb
      .from("social_integrations")
      .update(payload)
      .eq("user_id", userId)
      .eq("provider", "meta");

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    return NextResponse.json({ ok: true, ...payload });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "unexpected_error" }, { status: 500 });
  }
}
