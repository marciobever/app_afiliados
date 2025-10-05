// app/api/shopee/subids/route.ts
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

/** Plataformas reconhecidas + apelidos comuns */
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

/** Migra o formato antigo (main_channel, sub_channel, extra_1, extra_2) p/ o novo */
function migrateLegacyToNew(obj: any): SubidsPayload {
  const base = emptySubids();
  if (!obj || typeof obj !== "object") return base;

  // tenta mapear campos legados
  if (obj.main_channel) base.by_platform.instagram = String(obj.main_channel || "");
  if (obj.sub_channel)  base.by_platform.facebook  = String(obj.sub_channel || "");
  if (obj.extra_1)      base.by_platform.x         = String(obj.extra_1 || "");
  if (obj.extra_2)      base.by_platform.pinterest = String(obj.extra_2 || "");

  return base;
}

/** Normaliza qualquer subids vindo do DB para o formato novo */
function normalizeDbSubids(dbValue: any): SubidsPayload {
  if (!dbValue || typeof dbValue !== "object") {
    return emptySubids();
  }
  // se já veio no formato novo
  if (dbValue.by_platform) {
    const out = emptySubids();
    Object.assign(out.by_platform!, dbValue.by_platform || {});
    out.default = dbValue.default ?? "";
    out.aliases = { ...ALIASES, ...(dbValue.aliases || {}) };
    // garante todas as chaves conhecidas
    KNOWN_PLATFORMS.forEach(p => { out.by_platform![p] = out.by_platform![p] || ""; });
    return out;
  }
  // se veio no formato antigo
  return migrateLegacyToNew(dbValue);
}

/** Gera URL com subid1=<valor> (ou preserva query string existente) */
function appendSubid(baseUrl: string, subid: string, paramName = "subid1"): string {
  try {
    const u = new URL(baseUrl);
    if (subid) u.searchParams.set(paramName, subid);
    return u.toString();
  } catch {
    // se não for URL absoluta, tenta como relativa (fallback simples)
    const hasQ = baseUrl.includes("?");
    const sep = hasQ ? "&" : "?";
    return subid ? `${baseUrl}${sep}${paramName}=${encodeURIComponent(subid)}` : baseUrl;
  }
}

/* --------------------------------- GET ---------------------------------- */
/** GET: devolve os subids no formato novo */
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
/** PUT: salva/atualiza subids no formato novo (aceita legado e converte) */
export async function PUT(req: NextRequest) {
  try {
    const { orgId } = getUserContext();
    const sb = supabaseAdmin();
    await ensureOrg(sb, orgId);

    const body = await req.json().catch(() => ({} as any));

    // Se o cliente já manda no formato novo:
    let toSave: SubidsPayload | null = null;
    if (body && typeof body === "object" && (body.by_platform || body.default || body.aliases)) {
      const base = emptySubids();
      // merge cuidadoso
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
      // Formato antigo (main_channel, sub_channel, extra_1, extra_2)
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
 * POST: gera link com subid correto da plataforma
 * body: { base_url: string; platform?: string; paramName?: string }
 * - platform: "instagram" | "facebook" | "x" | "pinterest" | ...
 * - se não informar ou não existir, cai em `default`
 */
export async function POST(req: NextRequest) {
  try {
    const { orgId } = getUserContext();
    const sb = supabaseAdmin();
    await ensureOrg(sb, orgId);

    const { base_url = "", platform = "", paramName = "subid1" } = await req.json().catch(() => ({} as any));
    if (!base_url) return j({ error: "base_url é obrigatório" }, 400);

    const { data, error } = await sb
      .from("shopee_subids")
      .select("subids")
      .eq("org_id", orgId)
      .maybeSingle();

    if (error) return j({ error: error.message }, 500);

    const cfg = normalizeDbSubids(data?.subids);
    const normPlat = normalizePlatform(platform);
    const resolvedPlat = normPlat || (cfg.aliases && cfg.aliases[platform?.toLowerCase()]) || undefined;

    const subidFromPlatform =
      (resolvedPlat && cfg.by_platform?.[resolvedPlat]) || "";

    const finalSubid = subidFromPlatform || cfg.default || "";

    const tracked = appendSubid(String(base_url), finalSubid, String(paramName || "subid1"));

    return j({
      base_url,
      platform: resolvedPlat || platform || null,
      subid_used: finalSubid,
      url: tracked,
    });
  } catch (e: any) {
    return j({ error: String(e?.message || e) }, 400);
  }
}
