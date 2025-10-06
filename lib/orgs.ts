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

type OrgLite = { id: string; name: string; slug: string };
type Role = "owner" | "admin" | "member" | "viewer";

export async function getOrCreatePrimaryOrg(userId: string, email?: string) {
  const sb = supabaseAdmin().schema("Produto_Afiliado");

  // 1) tenta achar org já vinculada ao usuário (org_users)
  const q = await sb
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

  if (q.error) throw new Error(q.error.message);

  // orgs pode vir como objeto OU array; tratar ambos os casos
  const orgField = (q.data as any)?.orgs as OrgLite | OrgLite[] | undefined;
  const org: OrgLite | undefined = Array.isArray(orgField) ? orgField[0] : orgField;

  if (org?.id) {
    return { orgId: org.id, org };
  }

  // 2) não existe -> cria uma org "Pessoal" para o usuário
  const base = (email?.split("@")[0] || "workspace").slice(0, 32);
  const suffix = Math.random().toString(36).slice(2, 6);
  const name = `${base} (Pessoal)`;
  const slug = slugify(`${base}-${suffix}`);

  const { data: newOrg, error: e2 } = await sb
    .from("orgs")
    .insert({ name, slug, created_by: userId })
    .select("*")
    .single();
  if (e2) throw new Error(e2.message);

  // 3) vincula como owner (idempotente)
  const { error: e3 } = await sb
    .from("org_users")
    .upsert(
      { org_id: newOrg.id, user_id: userId, role: "owner" as Role },
      { onConflict: "org_id,user_id" }
    );
  if (e3) throw new Error(e3.message);

  return { orgId: newOrg.id as string, org: newOrg as OrgLite };
}
