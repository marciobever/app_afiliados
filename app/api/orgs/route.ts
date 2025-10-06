// app/api/orgs/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { getUserContext } from "@/lib/auth";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const MISSING_TABLE_RX =
  /(schema cache)|(does not exist)|relation .* does not exist|not find the table/i;

/**
 * GET /api/orgs
 * Lista organizações do usuário a partir de org_members → orgs (embed).
 * Requer FK org_members.org_id -> orgs.id no Supabase.
 */
export async function GET() {
  const { userId } = getUserContext();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sb = supabaseAdmin().schema("Produto_Afiliado");

  const sel = await sb
    .from("org_members")
    .select(`
      role,
      orgs!inner ( id, name, slug )
    `)
    .eq("user_id", userId);

  if (sel.error) {
    if (MISSING_TABLE_RX.test(sel.error.message || "")) {
      return NextResponse.json({ orgs: [], fallback: true });
    }
    return NextResponse.json({ error: sel.error.message }, { status: 500 });
  }

  const orgs = (sel.data ?? []).map((r: any) => ({
    id: r.orgs?.id,
    name: r.orgs?.name,
    slug: r.orgs?.slug,
    role: r.role,
  }));

  return NextResponse.json({ orgs });
}

/**
 * POST /api/orgs
 * Cria uma org e vincula o usuário atual como owner em org_members.
 * body: { name?: string; slug?: string }
 */
export async function POST(req: NextRequest) {
  const { userId } = getUserContext();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  let name = String(body?.name ?? "").trim();
  let slugInput = String(body?.slug ?? "").trim();

  if (!name && !slugInput) {
    return NextResponse.json({ error: "name_or_slug_required" }, { status: 400 });
  }

  if (!name) name = slugInput;
  let baseSlug = slugify(slugInput || name) || "workspace";

  const sb = supabaseAdmin().schema("Produto_Afiliado");

  // Garante slug único com algumas tentativas
  let created: any = null;
  let lastErr: string | null = null;
  for (let i = 0; i < 3 && !created; i++) {
    const trySlug =
      i === 0 ? baseSlug : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

    const ins = await sb
      .from("orgs")
      .insert({ name, slug: trySlug, created_by: userId })
      .select("id, name, slug")
      .single();

    if (!ins.error) {
      created = ins.data;
      break;
    }

    if (MISSING_TABLE_RX.test(ins.error.message || "")) {
      return NextResponse.json(
        { error: "schema_unavailable", message: ins.error.message, fallback: true },
        { status: 503 }
      );
    }

    lastErr = ins.error.message;
  }

  if (!created) {
    return NextResponse.json({ error: "create_failed", message: lastErr }, { status: 500 });
  }

  // Vincula criador como owner (idempotente)
  const up = await sb
    .from("org_members")
    .upsert(
      { org_id: created.id, user_id: userId, role: "owner" },
      { onConflict: "org_id,user_id" }
    );

  if (up.error && !MISSING_TABLE_RX.test(up.error.message || "")) {
    return NextResponse.json({ error: up.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, org: created });
}
