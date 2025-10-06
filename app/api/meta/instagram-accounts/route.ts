// app/api/meta/instagram-accounts/route.ts
import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { getUserContext } from "@/lib/auth";

export async function GET() {
  try {
    const { userId } = getUserContext();

    const sb = supabaseAdmin().schema("Produto_Afiliado");
    const { data, error } = await sb
      .from("social_integrations")
      .select("access_token")
      .eq("user_id", userId)
      .eq("provider", "meta")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data?.access_token) {
      return NextResponse.json({ error: "Conta Meta não conectada." }, { status: 401 });
    }

    const accessToken = data.access_token;
    const fields = "name,instagram_business_account{id,username}";
    let url = new URL("https://graph.facebook.com/v19.0/me/accounts");
    url.searchParams.set("fields", fields);
    url.searchParams.set("access_token", accessToken);

    const pages: any[] = [];
    while (url) {
      const r = await fetch(url.toString());
      const j = await r.json();

      if (!r.ok) {
        const code = j?.error?.code;
        const message = j?.error?.message || "Falha ao consultar Graph API (Facebook)";
        const status = code === 190 ? 401 : 500;
        return NextResponse.json({ error: message, code }, { status });
      }

      pages.push(...(j?.data || []));
      const next = j?.paging?.next;
      url = next ? new URL(next) : (null as any);
    }

    const accounts = pages.map((p: any) => ({
      id: p.id,
      name: p.name,
      instagram_business_account: p.instagram_business_account
        ? { id: p.instagram_business_account.id, username: p.instagram_business_account.username }
        : null,
    }));

    return NextResponse.json({ accounts });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro desconhecido ao buscar contas." }, { status: 500 });
  }
}
