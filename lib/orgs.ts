// lib/orgs.ts
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function getOrCreatePrimaryOrg(userId: string, email?: string) {
  const sb = supabaseAdmin().schema("Produto_Afiliado");

  // 1) tenta achar uma org já vinculada ao usuário
  const { data: found, error: e1 } = await sb
    .from("org_members")
    .select(`org_id, orgs ( id, name, slug )`)
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (e1) throw new Error(e1.message);
  if (found?.orgs?.id) {
    return { orgId: found.orgs.id, org: found.orgs };
  }

  // 2) não existe -> cria uma
  const base = email?.split("@")[0] || "workspace";
  const suffix = Math.random().toString(36).slice(2, 6);
  const name = `${base}'s Workspace`;
  const slug = slugify(`${base}-${suffix}`);

  const { data: org, error: e2 } = await sb
    .from("orgs")
    .insert({ name, slug })
    .select("*")
    .single();

  if (e2) throw new Error(e2.message);

  const { error: e3 } = await sb
    .from("org_members")
    .insert({ org_id: org.id, user_id: userId, role: "owner" });

  if (e3) throw new Error(e3.message);

  return { orgId: org.id, org };
}
