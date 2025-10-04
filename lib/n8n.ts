// lib/n8n.ts
const BASE = process.env.N8N_BASE_URL!;
const TOKEN = process.env.N8N_TOKEN || "";

const h = () => (TOKEN ? { Authorization: TOKEN } : {});

export async function postN8N<T>(path: string, body: unknown): Promise<T> {
  if (!BASE) {
    throw new Error("N8N_BASE_URL not set (defina no .env.local e reinicie o dev server)");
  }
  const url = `${BASE.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...h() },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`n8n POST ${url} -> ${res.status} ${res.statusText} :: ${txt}`);
  }

  return res.json() as Promise<T>;
}