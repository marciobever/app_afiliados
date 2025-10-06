// app/api/n8n/products/route.ts
import 'server-only';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type IncomingItem = {
  provider_pid: string;
  title: string;
  price_cents?: number | null;
  original_price_cents?: number | null;
  currency?: string;
  image_url?: string;
  rating?: number | null;
  reviews_count?: number | null;
  product_url?: string;
  // ...qualquer extra vai em `raw`
};

export async function POST(req: Request) {
  try {
    // 1) Segurança
    const secret = req.headers.get('x-api-key');
    if (secret !== process.env.N8N_SECRET) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    // 2) Payload
    const payload = await req.json().catch(() => ({} as any));
    const items: IncomingItem[] = Array.isArray(payload?.items) ? payload.items : [];
    const search_id: string | undefined = payload?.search_id;

    if (!search_id) {
      return NextResponse.json({ ok: false, error: 'search_id required' }, { status: 400 });
    }
    if (!items.length) {
      return NextResponse.json({ ok: true, inserted: 0, updated: 0 });
    }

    const sb = supabaseAdmin().schema('Produto_Afiliado');

    // 3) Carrega a search para obter org_id / user_id (created_by)
    const { data: search, error: sErr } = await sb
      .from('searches')
      .select('id, org_id, user_id')
      .eq('id', search_id)
      .maybeSingle();

    if (sErr) {
      return NextResponse.json({ ok: false, error: 'db_error', message: sErr.message }, { status: 500 });
    }
    if (!search) {
      return NextResponse.json({ ok: false, error: 'search_not_found' }, { status: 404 });
    }

    // 4) Monta rows respeitando colunas NOT NULL do schema
    const rows = items.map((p) => ({
      org_id: search.org_id,             // NOT NULL no teu schema
      created_by: search.user_id ?? null,
      search_id: search.id,
      provider: 'shopee',
      provider_pid: String(p.provider_pid || ''),
      title: String(p.title || ''),
      price_cents: p.price_cents ?? null,
      original_price_cents: p.original_price_cents ?? null,
      currency: p.currency ?? 'BRL',
      image_url: p.image_url ?? null,
      rating: p.rating ?? null,
      reviews_count: p.reviews_count ?? null,
      product_url: p.product_url ?? null,
      raw: p as any,
    })).filter(r => r.provider_pid && r.title); // saneamento básico

    if (!rows.length) {
      return NextResponse.json({ ok: true, inserted: 0, updated: 0 });
    }

    // 5) Upsert pelos campos únicos
    const { data: upsertData, error: upErr } = await sb
      .from('products')
      .upsert(rows, { onConflict: 'search_id,provider,provider_pid' })
      .select('id'); // para sabermos quantos registros o PostgREST retornou

    if (upErr) {
      return NextResponse.json({ ok: false, error: 'db_error', message: upErr.message }, { status: 500 });
    }

    // 6) Marca a search como concluída
    await sb
      .from('searches')
      .update({ status: 'done', updated_at: new Date().toISOString() })
      .eq('id', search.id);

    return NextResponse.json({
      ok: true,
      affected: upsertData?.length ?? rows.length,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: 'db_error', message: e?.message || String(e) },
      { status: 500 }
    );
  }
}
