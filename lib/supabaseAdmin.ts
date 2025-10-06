// lib/supabaseAdmin.ts
'use server';

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Guard: nunca use isso no browser
if (typeof window !== "undefined") {
  throw new Error("supabaseAdmin só pode ser usado no servidor");
}

let _client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !/^https?:\/\//.test(url)) {
    throw new Error("SUPABASE_URL inválida/ausente");
  }
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente");
  _client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _client;
}

export default supabaseAdmin;
