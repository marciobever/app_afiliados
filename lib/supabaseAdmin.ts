// lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url) throw new Error("SUPABASE_URL ausente");
if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente");

// cliente único (server-side, sem persistência)
const _client = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 1) export default: cliente direto
export default _client;

// 2) export nomeado: função compatível com código que chama supabaseAdmin()
export function supabaseAdmin() {
  return _client;
}