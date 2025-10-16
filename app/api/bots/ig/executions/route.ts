// app/api/bots/ig/executions/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // evita prerender/export
export const runtime = "nodejs";        // garante execução no Node (não edge)
export const revalidate = 0;            // sempre dinâmico

export async function GET() {
  try {
    const base = process.env.N8N_BASE_URL;
    const token = process.env.N8N_TOKEN;
    const workflowId = process.env.N8N_IG_WORKFLOW_ID || "";

    // Se não estiver configurado no ambiente, devolve vazio (não quebra o build)
    if (!base || !token) {
      return NextResponse.json({ ok: true, data: [] });
    }

    // Usa URL de forma segura (sem replace em string indefinida)
    const url = new URL("/rest/executions", base);
    if (workflowId) url.searchParams.set("workflowId", workflowId);
    url.searchParams.set("limit", "20");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    // n8n retorna JSON; se falhar, devolve estrutura vazia
    const data = await res.json().catch(() => ({ data: [] }));
    return NextResponse.json(data);
  } catch (e: any) {
    // fallback seguro: não derruba build nem runtime
    return NextResponse.json({ ok: true, data: [] });
  }
}
