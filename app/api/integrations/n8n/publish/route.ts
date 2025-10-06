// app/api/integrations/n8n/publish/route.ts
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// --- N8N webhook ---
const N8N_PUBLISH_URL =
  process.env.N8N_PUBLISH_URL ||
  process.env.N8N_PUBLISH_WEBHOOK_URL ||
  'https://n8n.seureview.com.br/webhook/social';

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

// Busca a integração Meta mais recente do usuário
async function getLatestMetaIntegrationByUser(userId: string) {
  const sb = supabaseAdmin().schema('Produto_Afiliado');

  const { data, error } = await sb
    .from('social_integrations')
    .select(`
      provider,
      meta_user_id,
      access_token,
      instagram_business_id,
      instagram_username,
      page_id,
      page_name,
      granted_scopes,
      obtained_at,
      expires_in
    `)
    .eq('user_id', userId)
    .eq('provider', 'meta')
    .order('obtained_at', { ascending: false, nullsFirst: false })
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

    if (!platform || !['facebook', 'instagram', 'x'].includes(platform)) {
      return NextResponse.json(
        { error: 'invalid_platform', message: 'Use "facebook", "instagram" ou "x".' },
        { status: 400 }
      );
    }
    if (!caption) return NextResponse.json({ error: 'missing_caption' }, { status: 400 });
    if (!trackedUrl) return NextResponse.json({ error: 'missing_tracked_url' }, { status: 400 });

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

    const provider = platform === 'instagram' ? 'instagram' : 'meta';
    const image_url: string | undefined = product.image || undefined;

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

    const payloadForN8n = {
      provider,
      caption,
      image_url,
      access_token,
      ig_business_id: provider === 'instagram' ? ig_business_id : null,
      fb_page_id: provider === 'meta' ? fb_page_id : null,

      // compat legado
      platform,
      platform_subid: platform,
      link: trackedUrl,
      product,
      scheduleTime: scheduleTime || null,

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
