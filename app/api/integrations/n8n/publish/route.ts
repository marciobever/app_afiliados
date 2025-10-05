// app/api/integrations/n8n/publish/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserContext } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// --- N8N webhook ---
const N8N_PUBLISH_URL =
  process.env.N8N_PUBLISH_URL ||
  process.env.N8N_PUBLISH_WEBHOOK_URL ||
  'https://n8n.seureview.com.br/webhook/social';

// --- Supabase admin client (sem DATABASE_URL) ---
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

function supabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias no ambiente.'
    );
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

type PlatformKey = 'facebook' | 'instagram' | 'x';

type Product = {
  id: string;
  title: string;
  price: number | null;
  rating: number | null;
  image: string;
  url: string;
};

function deriveShopeeIdFromUrl(url?: string): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    const idx = parts.findIndex((p) => p.toLowerCase() === 'product');
    if (idx >= 0 && parts[idx + 1] && parts[idx + 2]) {
      return `${parts[idx + 1]}_${parts[idx + 2]}`;
    }
  } catch {}
  return '';
}

function ensureSafeProduct(baseUrl: string, p?: Partial<Product> | null): Product {
  const id =
    (p?.id && String(p.id)) ||
    deriveShopeeIdFromUrl(p?.url || baseUrl) ||
    deriveShopeeIdFromUrl(baseUrl);

  return {
    id,
    title: p?.title ?? '',
    price:
      typeof p?.price === 'number'
        ? p.price
        : p?.price != null
        ? Number(p.price as any)
        : null,
    rating:
      typeof p?.rating === 'number'
        ? p.rating
        : p?.rating != null
        ? Number(p.rating as any)
        : null,
    image: p?.image ?? '',
    url: p?.url ?? baseUrl,
  };
}

async function getLatestMetaIntegrationByUser(userId: string) {
  const sb = supabaseAdmin();
  // Pega a mais recente pela data (obtained_at/updated_at)
  const { data, error } = await sb
    .from('social_integrations')
    .select(
      `
      provider,
      meta_user_id,
      access_token,
      instagram_business_id,
      instagram_username,
      page_id,
      page_name,
      granted_scopes,
      obtained_at,
      expires_in,
      updated_at
    `
    )
    .eq('user_id', userId)
    .eq('provider', 'meta')
    .order('obtained_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));

    const platform = String(body.platform || '').toLowerCase() as PlatformKey;
    const caption = String(body.caption || '');
    const trackedUrl = String(body.trackedUrl || body.link || '');
    const scheduleTime: string | null =
      body.scheduleTime != null ? String(body.scheduleTime) : null;

    const product = ensureSafeProduct(body?.product?.url || '', body.product);

    // validações básicas do payload
    if (!platform || !['facebook', 'instagram', 'x'].includes(platform)) {
      return NextResponse.json(
        { error: 'invalid_platform', message: 'Use "facebook", "instagram" ou "x".' },
        { status: 400 }
      );
    }
    if (!caption) {
      return NextResponse.json({ error: 'missing_caption' }, { status: 400 });
    }
    if (!trackedUrl) {
      return NextResponse.json({ error: 'missing_tracked_url' }, { status: 400 });
    }

    // contexto do usuário logado (multi-tenant)
    let userId = '';
    let orgId = '';
    try {
      const ctx = getUserContext() as any;
      userId = ctx?.userId ?? ctx?.userIdNorm ?? '';
      orgId = ctx?.orgId ?? '';
    } catch {}
    if (!userId) {
      return NextResponse.json(
        { error: 'unauthenticated', message: 'Sessão não encontrada.' },
        { status: 401 }
      );
    }

    // pega credenciais META dessa pessoa
    const integ = await getLatestMetaIntegrationByUser(userId);
    if (!integ) {
      return NextResponse.json(
        {
          error: 'meta_integration_not_found',
          message: 'Vincule sua conta do Facebook/Instagram nas Configurações.',
        },
        { status: 400 }
      );
    }

    const access_token: string = integ.access_token;
    const ig_business_id: string | null = integ.instagram_business_id || null;
    const fb_page_id: string | null = integ.page_id || null;

    // provider real para o n8n/Graph
    const provider = platform === 'instagram' ? 'instagram' : 'meta';
    const image_url: string | undefined = product.image || undefined;

    // checagens finais por plataforma
    const missing: string[] = [];
    if (!access_token) missing.push('access_token');
    if (provider === 'instagram') {
      if (!ig_business_id) missing.push('instagram_business_id');
      if (!image_url) missing.push('image_url');
    } else {
      if (!fb_page_id) missing.push('page_id');
    }
    if (missing.length) {
      return NextResponse.json(
        {
          error: 'missing_credentials',
          message:
            'Credenciais/informações insuficientes para publicar. Verifique as permissões do Facebook/Instagram.',
          missing,
        },
        { status: 400 }
      );
    }

    // monta payload que seu workflow já aceita
    const payloadForN8n = {
      // novo (Graph)
      provider, // 'instagram' | 'meta'
      caption,
      image_url,
      access_token,
      ig_business_id: provider === 'instagram' ? ig_business_id : null,
      fb_page_id: provider === 'meta' ? fb_page_id : null,

      // compat com o workflow atual
      platform, // 'facebook' | 'instagram' | 'x'
      platform_subid: platform,
      link: trackedUrl,
      product: {
        id: product.id || deriveShopeeIdFromUrl(product.url),
        title: product.title,
        price: product.price,
        rating: product.rating,
        image: product.image,
        url: product.url,
      },
      scheduleTime: scheduleTime || null,

      // contexto para logs
      context: {
        source: 'composer',
        ts: new Date().toISOString(),
        userId,
        orgId,
        productId: product.id,
        productUrl: product.url,
      },
    };

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (process.env.N8N_SECRET) headers['x-api-key'] = process.env.N8N_SECRET;

    const r = await fetch(N8N_PUBLISH_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payloadForN8n),
      cache: 'no-store',
    });

    const text = await r.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!r.ok) {
      return NextResponse.json(
        { error: `n8n responded ${r.status}`, data },
        { status: 502 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'publish_proxy_failed', message: e?.message || String(e) },
      { status: 500 }
    );
  }
}
