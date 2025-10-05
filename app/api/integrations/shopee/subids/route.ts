// app/api/integrations/shopee/subids/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUserContext } from "@/lib/auth";

function j(res: any, status = 200) {
  return NextResponse.json(res, { status });
}

async function ensureOrg(sb: ReturnType<typeof supabaseAdmin>, orgId: string) {
  const { data, error } = await sb.from("orgs").select("id").eq("id", orgId).maybeSingle();
  if (error) throw new Error(`Falha ao verificar orgs: ${error.message}`);
  if (!data) {
    const { error: insErr } = await sb.from("orgs").insert({ id: orgId, name: "default" });
    if (insErr) throw new Error(`Falha ao criar org: ${insErr.message}`);
  }
}

/* ---------------- Plataformas conhecidas ---------------- */
const KNOWN_PLATFORMS = [
  "instagram","facebook","x","pinterest","tiktok","youtube","whatsapp","others"
] as const;
type KnownPlatform = typeof KNOWN_PLATFORMS[number];

const ALIASES: Record<string, KnownPlatform> = {
  insta: "instagram",
  ig: "instagram",
  fb: "facebook",
  meta: "facebook",
  twitter: "x",
  tw: "x",
  pin: "pinterest",
  yt: "youtube",
  wa: "whatsapp",
};

function normalizePlatform(raw?: string): KnownPlatform | undefined {
  if (!raw) return;
  const k = String(raw).trim().toLowerCase();
  if ((KNOWN_PLATFORMS as readonly string[]).includes(k)) return k as KnownPlatform;
  if (ALIASES[k]) return ALIASES[k];
  return undefined;
}

/* ---------------- Estrutura dos SubIDs ---------------- */
type SubidsPayload = {
  by_platform: Partial<Record<KnownPlatform, string>>;
  default?: string;
  aliases?: Record<string, KnownPlatform>;
};

function emptySubids(): SubidsPayload {
  const by_platform: Partial<Record<KnownPlatform, string>> = {};
  KNOWN_PLATFORMS.forEach(p => { by_platform[p] = ""; });
  return { by_platform, default: "", aliases: ALIASES };
}

/* ---------------- Migração formato antigo ---------------- */
function migrateLegacyToNew(obj: any): SubidsPayload {
  const base = emptySubids();
  if (!obj || typeof obj !== "object") return base;

  if (obj.main_channel) base.by_platform.instagram = String(obj.main_channel || "");
  if (obj.sub_channel)  base.by_platform.facebook  = String(obj.sub_channel || "");
  if (obj.extra_1)      base.by_platform.x         = String(obj.extra_1 || "");
  if (obj.extra_2)      base.by_platform.pinterest = String(obj.extra_2 || "");

  return base;
}

/* ---------------- Normalização DB ---------------- */
function normalizeDbSubids(dbValue: any): SubidsPayload {
  if (!dbValue || typeof dbValue !== "object") {
    return emptySubids();
  }
  if (dbValue.by_platform) {
    const out = emptySubids();
    Object.assign(out.by_platform!, dbValue.by_platform || {});
    out.default = dbValue.default ?? "";
    out.aliases = { ...ALIASES, ...(dbValue.aliases || {}) };
    KNOWN_PLATFORMS.forEach(p => { out.by_platform![p] = out.by_platform![p] || ""; });
    return out;
  }
  return migrateLegacyToNew(dbValue);
}

/* ---------------- Função utilitária ---------------- */
function appendSubid(baseUrl: string, subids: string[]): string {
  try {
    const u = new URL(baseUrl);
    // limpa subid1..subid5 antigos
    for (let i = 1; i <= 5; i++) u.searchParams.delete(`subid${i}`);
    // aplica os novos (limite 5)
    subids.slice(0, 5).forEach((v, i) => u.searchParams.set(`subid${i + 1}`, v));
    return u.toString();
  } catch {
    const hasQ = baseUrl.includes("?");
    const sep = hasQ ? "&" : "?";
    return subids.length
      ? `${baseUrl}${sep}${subids
          .slice(0, 5)
          .map((v, i) => `subid${i + 1}=${encodeURIComponent(v)}`)
          .join("&")}`
      : baseUrl;
  }
}

/* --------------------------------- GET ---------------------------------- */
export async function GET() {
  try {
    const { orgId } = getUserContext();
    const sb = supabaseAdmin();
    await ensureOrg(sb, orgId);

    const { data, error } = await sb
      .from("shopee_subids")
      .select("subids, updated_at")
      .eq("org_id", orgId)
      .maybeSingle();

    if (error) return j({ error: error.message }, 500);
    const normalized = normalizeDbSubids(data?.subids);
    return j({ subids: normalized, updated_at: data?.updated_at ?? null });
  } catch (e: any) {
    return j({ error: String(e?.message || e) }, 400);
  }
}

/* --------------------------------- PUT ---------------------------------- */
export async function PUT(req: NextRequest) {
  try {
    const { orgId } = getUserContext();
    const sb = supabaseAdmin();
    await ensureOrg(sb, orgId);

    const body = await req.json().catch(() => ({} as any));

    let toSave: SubidsPayload | null = null;
    if (body && typeof body === "object" && (body.by_platform || body.default || body.aliases)) {
      const base = emptySubids();
      if (body.by_platform && typeof body.by_platform === "object") {
        for (const [k, v] of Object.entries(body.by_platform)) {
          const norm = normalizePlatform(k);
          if (norm) base.by_platform![norm] = String(v || "");
        }
      }
      base.default = String(body.default ?? "");
      base.aliases = { ...ALIASES, ...(body.aliases || {}) };
      toSave = base;
    } else {
      toSave = migrateLegacyToNew(body);
    }

    const upsert = {
      org_id: orgId,
      subids: toSave,
      updated_at: new Date().toISOString(),
    };

    const { error } = await sb
      .from("shopee_subids")
      .upsert(upsert, { onConflict: "org_id" });

    if (error) return j({ error: error.message }, 500);
    return j({ ok: true });
  } catch (e: any) {
    return j({ error: String(e?.message || e) }, 400);
  }
}

/* --------------------------------- POST --------------------------------- */
/**
 * POST: gera link com até 5 subids da plataforma.
 * body: { base_url: string; platform?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { orgId } = getUserContext();
    const sb = supabaseAdmin();
    await ensureOrg(sb, orgId);

    const { base_url = "", platform = "" } = await req.json().catch(() => ({} as any));
    if (!base_url) return j({ error: "base_url é obrigatório" }, 400);

    const { data, error } = await sb
      .from("shopee_subids")
      .select("subids")
      .eq("org_id", orgId)
      .maybeSingle();

    if (error) return j({ error: error.message }, 500);

    const cfg = normalizeDbSubids(data?.subids);
    const normPlat = normalizePlatform(platform);
    const resolvedPlat =
      normPlat || (cfg.aliases && cfg.aliases[platform?.toLowerCase()]) || undefined;

    const rawValue =
      (resolvedPlat && cfg.by_platform?.[resolvedPlat]) || cfg.default || "";

    const subidList = String(rawValue)
      .split(/\n|,|;/g)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5); // Shopee permite até 5

    const finalUrl = appendSubid(String(base_url), subidList);

    return j({
      base_url,
      platform: resolvedPlat || platform || null,
      subids_used: subidList,
      url: finalUrl,
    });
  } catch (e: any) {
    return j({ error: String(e?.message || e) }, 400);
  }
}
