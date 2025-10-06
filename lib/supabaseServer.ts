// lib/supabaseServer.ts
import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Somente variáveis privadas do servidor (NUNCA use anon aqui)
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) throw new Error('SUPABASE_URL ausente');
if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY ausente');

// Singleton para evitar múltiplas instâncias
declare global {
  // eslint-disable-next-line no-var
  var __SB_ADMIN__: SupabaseClient | undefined;
}

export const sbAdmin: SupabaseClient =
  global.__SB_ADMIN__ ??
  createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { 'X-Client-Info': 'app:server' } },
  });

if (!global.__SB_ADMIN__) global.__SB_ADMIN__ = sbAdmin;

// Compatível com usos existentes
export function supa() {
  return sbAdmin;
}

// Helper: já entra no schema do projeto
export function adminSchema(name = 'Produto_Afiliado') {
  return sbAdmin.schema(name);
}

export default sbAdmin;
