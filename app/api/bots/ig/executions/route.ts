// app/api/bots/ig/executions/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const N8N_BASE_URL = process.env.N8N_BASE_URL!;
  const N8N_TOKEN = process.env.N8N_TOKEN!;
  const workflowId = process.env.N8N_IG_WORKFLOW_ID || "";

  const url = new URL(`${N8N_BASE_URL.replace(/\/+$/,"")}/rest/executions`);
  if (workflowId) url.searchParams.set("workflowId", workflowId);
  url.searchParams.set("limit", "20");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${N8N_TOKEN}` }
  });
  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status });
  const data = await res.json();
  return NextResponse.json(data);
}
