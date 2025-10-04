// lib/n8n.ts
const BASE = process.env.N8N_BASE_URL!;
const TOKEN = process.env.N8N_TOKEN || "";

/** Headers padrão, incluindo auth opcional */
function defaultHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (TOKEN) headers["Authorization"] = TOKEN.startsWith("Bearer ") ? TOKEN : `Bearer ${TOKEN}`;
  return headers;
}

/** Faz POST seguro ao n8n com timeout e logs úteis */
export async function postN8N<T = any>(
  path: string,
  body: unknown,
  opts?: { timeoutMs?: number; verbose?: boolean }
): Promise<T> {
  if (!BASE) {
    throw new Error("❌ N8N_BASE_URL not set (defina no .env.local e reinicie o dev server)");
  }

  const url = `${BASE.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const timeoutMs = opts?.timeoutMs ?? 15000; // padrão: 15s
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (opts?.verbose) {
      console.log("🔹 postN8N:", url, JSON.stringify(body).slice(0, 500));
    }

    const res = await fetch(url, {
      method: "POST",
      headers: defaultHeaders(),
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timer);

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      const summary = txt.slice(0, 400) || "(sem resposta)";
      throw new Error(`❌ n8n POST ${url} → ${res.status} ${res.statusText}\n${summary}`);
    }

    // tenta parsear JSON com fallback
    try {
      return (await res.json()) as T;
    } catch {
      const txt = await res.text();
      throw new Error(`❌ n8n retornou resposta não-JSON (${url}): ${txt}`);
    }
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error(`⏰ Timeout ao chamar n8n (${timeoutMs}ms): ${url}`);
    }
    throw err;
  }
}
