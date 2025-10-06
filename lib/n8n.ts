// lib/n8n.ts
const BASE = process.env.N8N_BASE_URL!;
const TOKEN = process.env.N8N_TOKEN || "";     // opcional (Authorization)
const SECRET = process.env.N8N_SECRET || "";   // opcional (x-api-key)

/** Headers padrão, incluindo auth opcional */
function defaultHeaders() {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (TOKEN) headers["Authorization"] = TOKEN.startsWith("Bearer ")
    ? TOKEN
    : `Bearer ${TOKEN}`;
  if (SECRET) headers["x-api-key"] = SECRET;
  return headers;
}

/** POST seguro ao n8n com timeout e leitura única do body */
export async function postN8N<T = any>(
  path: string,
  body: unknown,
  opts?: { timeoutMs?: number; verbose?: boolean }
): Promise<T> {
  if (!BASE) {
    throw new Error("❌ N8N_BASE_URL not set");
  }

  const url = `${BASE.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const timeoutMs = opts?.timeoutMs ?? 15_000;
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

    // ⚠️ leia o body UMA vez
    const raw = await res.text();

    if (!res.ok) {
      // frequentemente o n8n devolve texto/HTML em erro
      throw new Error(`❌ n8n POST ${url} → ${res.status} ${res.statusText}\n${raw.slice(0, 400)}`);
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      throw new Error(`❌ n8n retornou resposta não-JSON: ${raw.slice(0, 400)}`);
    }
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error(`⏰ Timeout ao chamar n8n (${timeoutMs}ms): ${url}`);
    }
    throw err;
  }
}
