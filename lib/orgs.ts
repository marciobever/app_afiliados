// lib/orgs.ts
import supabaseAdmin from "@/lib/supabaseAdmin";

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

const MISSING_TABLE_RX =
  /(schema cache)|(does not exist)|relation .* does not exist|not find the table/i;

export async function getOrCreatePrimaryOrg(userId: string, email?: string) {
  const sb = supabaseAdmin().schema("Produto_Afiliado");

  // 1) tenta achar org já vinculada ao usuário
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

  if (q.error) {
    if (MISSING_TABLE_RX.test(q.error.message || "")) {
      // schema/tabelas ainda não expostos → não trava
      return { orgId: userId, org: null, fallback: true as const };
    }
    throw new Error(q.error.message);
  }

  const orgField = (q.data as any)?.orgs as OrgLite | OrgLite[] | undefined;
  const org: OrgLite | undefined = Array.isArray(orgField) ? orgField[0] : orgField;

  if (org?.id) {
    return { orgId: org.id, org, fallback: false as const };
  }

  // 2) não existe -> cria uma org "Pessoal" para o usuário
  const base = (email?.split("@")[0] || "workspace").slice(0, 32);
  const name = `${base} (Pessoal)`;
  const slug = slugify(`${base}-${Math.random().toString(36).slice(2, 6)}`);

  const ins = await sb
    .from("orgs")
    .insert({ name, slug, created_by: userId })
    .select("id, name, slug")
    .single();

  if (ins.error) {
    if (MISSING_TABLE_RX.test(ins.error.message || "")) {
      return { orgId: userId, org: null, fallback: true as const };
    }
    throw new Error(ins.error.message);
  }

  const newOrg = ins.data as OrgLite;

  // 3) vincula como owner (idempotente)
  const up = await sb
    .from("org_users")
    .upsert(
      { org_id: newOrg.id, user_id: userId, role: "owner" as Role },
      { onConflict: "org_id,user_id" }
    );

  if (up.error && !MISSING_TABLE_RX.test(up.error.message || "")) {
    throw new Error(up.error.message);
  }

  return { orgId: newOrg.id, org: newOrg, fallback: false as const };
}
