import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUserContext } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  // pega usuário da sessão (cookies)
  const { userId } = getUserContext();

  const sb = supabaseAdmin().schema("Produto_Afiliado");

  // Supondo FK org_members.org_id -> orgs.id
  // Ajuste o select conforme seus relacionamentos cadastrados no Supabase
  const { data, error } = await sb
    .from("org_members")
    .select(`
      org_id,
      role,
      orgs (
        id,
        name,
        slug
      )
    `)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orgs = (data || []).map((r: any) => ({
    id: r.orgs?.id,
    name: r.orgs?.name,
    slug: r.orgs?.slug,
    role: r.role,
  }));

  return NextResponse.json({ orgs });
}

export async function POST(req: NextRequest) {
  const { userId } = getUserContext();
  const { name, slug } = await req.json().catch(() => ({} as any));

  if (!name || !slug) {
    return NextResponse.json(
      { error: "name e slug são obrigatórios" },
      { status: 400 }
    );
  }

  const sb = supabaseAdmin().schema("Produto_Afiliado");

  // cria org
  const { data: org, error: e1 } = await sb
    .from("orgs")
    .insert({ name, slug })
    .select("*")
    .single();

  if (e1) {
    return NextResponse.json({ error: e1.message }, { status: 500 });
  }

  // adiciona o criador como owner
  const { error: e2 } = await sb
    .from("org_members")
    .insert({ org_id: org.id, user_id: userId, role: "owner" });

  if (e2) {
    return NextResponse.json({ error: e2.message }, { status: 500 });
  }

  return NextResponse.json({ org });
}