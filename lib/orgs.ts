// lib/orgs.ts
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Retorna a org principal do usuário. Se não existir, cria uma org "Pessoal"
 * e vincula o usuário como owner (idempotente).
 */
export async function getOrCreatePrimaryOrg(userId: string, email?: string) {
  const sb = supabaseAdmin().schema("Produto_Afiliado");

  // 1) tenta achar org já vinculada ao usuário (org_users)
  const { data: found, error: e1 } = await sb
    .from("org_users")
    .select(
      `
      org_id,
      role,
      orgs:orgs!inner ( id, name, slug )
    `
    )
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (e1) throw new Error(e1.message);
  if (found?.orgs?.id) {
    return { orgId: found.orgs.id as string, org: found.orgs };
  }

  // 2) não existe -> cria uma org "Pessoal" para o usuário
  const base = (email?.split("@")[0] || "workspace").slice(0, 32);
  const suffix = Math.random().toString(36).slice(2, 6);
  const name = `${base} (Pessoal)`;
  const slug = slugify(`${base}-${suffix}`);

  const { data: org, error: e2 } = await sb
    .from("orgs")
    .insert({ name, slug, created_by: userId })
    .select("*")
    .single();
  if (e2) throw new Error(e2.message);

  // 3) vincula como owner (idempotente)
  const { error: e3 } = await sb
    .from("org_users")
    .upsert(
      { org_id: org.id, user_id: userId, role: "owner" },
      { onConflict: "org_id,user_id" }
    );
  if (e3) throw new Error(e3.message);

  return { orgId: org.id as string, org };
}
