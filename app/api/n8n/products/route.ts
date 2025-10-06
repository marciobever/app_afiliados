// app/api/n8n/products/route.ts
import 'server-only';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const secret = req.headers.get('x-api-key');
    if (secret !== process.env.N8N_SECRET) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const payload = await req.json();
    const items = payload?.items ?? [];
    const search_id = payload?.search_id;

    if (!search_id) {
      return NextResponse.json({ ok: false, error: 'search_id required' }, { status: 400 });
    }

    const sb = supabaseAdmin().schema('Produto_Afiliado');

    const rows = items.map((p: any) => ({
      search_id,
      provider: 'shopee',
      provider_pid: p.provider_pid,
      title: p.title,
      price_cents: p.price_cents,
      original_price_cents: p.original_price_cents ?? null,
      currency: p.currency ?? 'BRL',
      image_url: p.image_url,
      rating: p.rating ?? null,
      reviews_count: p.reviews_count ?? null,
      product_url: p.product_url,
      raw: p,
    }));

    if (rows.length) {
      await sb
        .from('products')
        .upsert(rows, { onConflict: 'search_id,provider,provider_pid' });
    }

    await sb.from('searches').update({ status: 'done' }).eq('id', search_id);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: 'db_error', message: e?.message || String(e) },
      { status: 500 }
    );
  }
}
