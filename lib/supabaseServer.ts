// lib/supabaseServer.ts
'use server';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use APENAS variáveis privadas do servidor
const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url) throw new Error('SUPABASE_URL ausente');
if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY ausente');

// Hard guard: se isso rodar no browser, explode (evita vazar Service Role)
if (typeof window !== 'undefined') {
  throw new Error('supabaseServer só pode ser usado no servidor');
}

// Singleton para evitar múltiplas instâncias em hot-reload
const g = globalThis as unknown as { __SB_ADMIN__?: SupabaseClient };

export const sbAdmin: SupabaseClient =
  g.__SB_ADMIN__ ??
  createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { 'X-Client-Info': 'app:server' } },
  });

if (!g.__SB_ADMIN__) g.__SB_ADMIN__ = sbAdmin;

// Compatível com seu código atual
export function supa() {
  return sbAdmin;
}

// Helper opcional para já entrar no schema do projeto
export function adminSchema(name = 'Produto_Afiliado') {
  return sbAdmin.schema(name);
}

export default sbAdmin;
