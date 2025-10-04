import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import bcrypt from "bcryptjs";

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const { email, name, password, orgName } = await req.json();

    if (!email || !password || !orgName) {
      return NextResponse.json(
        { error: "email, password e orgName são obrigatórios" },
        { status: 400 }
      );
    }

    const sb = supabaseAdmin(); // ✅ agora sb é um SupabaseClient

    const password_hash = await bcrypt.hash(String(password), 10);

    // 1) upsert user
    const { data: userRow, error: upErr } = await sb
      .from("app_users")
      .upsert(
        { email, name: name ?? null, password_hash },
        { onConflict: "email" }
      )
      .select("*")
      .single();
    if (upErr) throw upErr;

    // 2) upsert org
    const slug = slugify(orgName);
    const { data: orgRow, error: orgErr } = await sb
      .from("orgs")
      .upsert({ name: orgName, slug }, { onConflict: "slug" })
      .select("*")
      .single();
    if (orgErr) throw orgErr;

    // 3) vínculo owner
    const { error: linkErr } = await sb
      .from("org_users")
      .upsert(
        { org_id: orgRow.id, user_id: userRow.id, role: "owner" },
        { onConflict: "org_id,user_id" }
      );
    if (linkErr) throw linkErr;

    return NextResponse.json({
      ok: true,
      userId: userRow.id,
      orgId: orgRow.id,
      email,
      org: { name: orgRow.name, slug: orgRow.slug },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "seed-owner error" },
      { status: 500 }
    );
  }
}