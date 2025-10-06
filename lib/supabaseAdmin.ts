// lib/supabaseAdmin.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url) throw new Error("SUPABASE_URL ausente");
if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente");

// Evita criar múltiplos clientes em dev (hot-reload do Next.js)
const globalForSb = globalThis as unknown as { __SB_ADMIN__?: SupabaseClient };

// Singleton
export const sbAdmin: SupabaseClient =
  globalForSb.__SB_ADMIN__ ??
  createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

if (!globalForSb.__SB_ADMIN__) globalForSb.__SB_ADMIN__ = sbAdmin;

// Export default (compatível com teu código atual)
export default sbAdmin;

// Função compatível com o que já chama supabaseAdmin()
export function supabaseAdmin() {
  return sbAdmin;
}

// Helper opcional: já entra no schema padrão do projeto
export function adminSchema(name = "Produto_Afiliado") {
  return sbAdmin.schema(name);
}
