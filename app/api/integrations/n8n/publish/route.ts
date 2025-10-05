// app/api/integrations/n8n/publish/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Aceita envs e tem fallback para o seu webhook
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
    if (!caption) {
      return NextResponse.json({ error: 'missing_caption' }, { status: 400 });
    }
    if (!trackedUrl) {
      return NextResponse.json({ error: 'missing_tracked_url' }, { status: 400 });
    }

    // Monta o payload esperado pelo seu workflow do n8n (igual ao curl)
    const payloadForN8n = {
      platform,
      platform_subid: platform,
      caption,
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
      context: {
        source: 'composer',
        ts: new Date().toISOString(),
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

    // n8n normalmente retorna: { "message": "Workflow was started" }
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'publish_proxy_failed', message: e?.message || String(e) },
      { status: 500 }
    );
  }
}
