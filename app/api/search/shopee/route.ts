// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { postN8N } from "@/lib/n8n";
import { getUserContext } from "@/lib/auth";

/**
 * API segura para busca — faz proxy para o n8n sem expor o host.
 * Lê userId/orgId do cookie de sessão (getUserContext).
 */
export async function POST(req: NextRequest) {
  // Lê usuário logado do cookie JWT
  const { userId, orgId } = getUserContext();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Lê o corpo da requisição
  const body = await req.json().catch(() => ({} as any));

  // Monta o payload para o n8n
  const payload = {
    userId,
    orgId: orgId ?? "default",
    query: body.query || "",
    filters: body.filters || { limit: 24 },
    sort: body.sort || "relevance",
    country: body.country || "BR",
    // opcional: canais
    // channels: body.channels ?? [["mina","insta"], ["mina","reels"]],
  };

  try {
    // Envia para o webhook do n8n
    const data = await postN8N<{ items: any[]; cursor?: string | null }>(
      "/webhook/shopee_search",
      payload
    );

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Erro ao consultar n8n:", err);
    return NextResponse.json(
      { error: "n8n_request_failed", detail: err?.message || err },
      { status: 500 }
    );
  }
}
