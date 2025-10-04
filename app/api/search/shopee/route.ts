import { NextRequest, NextResponse } from "next/server";
import { postN8N } from "@/lib/n8n";
import { getUserContext } from "@/lib/auth";

// Este endpoint evita expor o host do n8n ao cliente
export async function POST(req: NextRequest) {
  const { userId, orgId } = getUserContext(); // <- sem argumentos
  if (!userId || !orgId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const payload = {
    orgId,
    userId,
    query: body.query || "",
    filters: body.filters || { limit: 24 },
    sort: body.sort || "relevance",
    country: body.country || "BR",
    // opcional: channels
    // channels: body.channels ?? [["mina","insta"], ["mina","reels"]]
  };

  // webhook do n8n (ajuste o path se for diferente)
  const data = await postN8N<{ items: any[]; cursor?: string | null }>(
    "/webhook/shopee_search",
    payload
  );

  return NextResponse.json(data);
}