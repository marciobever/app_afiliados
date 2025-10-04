import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUserContext } from "@/lib/auth";

/**
 * Retorna as páginas vinculadas à conta Meta do usuário logado
 * (e suas respectivas contas de Instagram Business).
 */
export async function GET() {
  try {
    // garante que o usuário está logado
    const { userId } = getUserContext();

    // busca o token salvo na tabela social_integrations
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("social_integrations")
      .select("access_token")
      .eq("user_id", userId)
      .eq("provider", "meta")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data?.access_token)
      return NextResponse.json({ error: "Conta Meta não conectada." }, { status: 401 });

    const accessToken = data.access_token;

    // chama o Graph API para listar as PÁGINAS com conta IG vinculada
    const fbRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=name,instagram_business_account{id,username}&access_token=${accessToken}`
    );

    const json = await fbRes.json();

    if (!fbRes.ok) {
      throw new Error(
        json?.error?.message ||
          "Falha ao consultar Graph API (Facebook)"
      );
    }

    // retorna lista de contas
    return NextResponse.json({ accounts: json.data || [] });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Erro desconhecido ao buscar contas do Instagram." },
      { status: 500 }
    );
  }
}
