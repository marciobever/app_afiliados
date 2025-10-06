// lib/n8n.ts
'use server';
import 'server-only';

const BASE = (process.env.N8N_BASE_URL || '').replace(/\/+$/, '');
const TOKEN = process.env.N8N_TOKEN || '';
const N8N_SECRET = process.env.N8N_SECRET || '';

function defaultHeaders() {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  // auth opcional por token Bearer
  if (TOKEN) h['Authorization'] = TOKEN.startsWith('Bearer ') ? TOKEN : `Bearer ${TOKEN}`;
  // auth opcional via x-api-key (alinhado com seus webhooks)
  if (N8N_SECRET) h['x-api-key'] = N8N_SECRET;
  return h;
}

/** POST seguro ao n8n com timeout e leitura única do body */
export async function postN8N<T = unknown>(
  path: string,
  payload: unknown,
  opts?: { timeoutMs?: number; verbose?: boolean }
): Promise<T> {
  if (!BASE) throw new Error('N8N_BASE_URL não está definido');

  const url = `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const timeoutMs = opts?.timeoutMs ?? 15000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (opts?.verbose) {
      console.log('postN8N →', url, JSON.stringify(payload).slice(0, 500));
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
      // ajuda o Next a não tentar cachear nada
      next: { revalidate: 0 },
    });

    clearTimeout(timer);

    if (!res.ok) {
      // lê UMA vez para debugar sem quebrar o stream
      const txt = await res.text().catch(() => '');
      const snippet = txt?.slice(0, 400) || '(sem corpo)';
      throw new Error(`n8n ${res.status} ${res.statusText} — ${snippet}`);
    }

    // tenta JSON uma única vez; se falhar, mostra texto cru
    try {
      return (await res.json()) as T;
    } catch {
      const txt = await res.text();
      throw new Error(`n8n retornou texto não-JSON: ${txt}`);
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error(`Timeout (${timeoutMs}ms) chamando ${url}`);
    }
    throw err;
  }
}
