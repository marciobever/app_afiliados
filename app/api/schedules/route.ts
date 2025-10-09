// app/api/schedules/route.ts
import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const { userId } = requireSession();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // queued|claimed|error|done|canceled|all

    const sb = supabaseAdmin().schema('Produto_Afiliado');

    let query = sb
      .from('schedules_queue')
      // ⚠️ sem url_canonical; buscamos payload para extrair o url do produto
      .select('id, provider, platform, caption, image_url, shortlink, scheduled_at, status, payload')
      .eq('user_id', userId)
      .order('scheduled_at', { ascending: true });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Monta resposta já com url_canonical derivado
    const items = (data ?? []).map((r: any) => ({
      id: r.id,
      provider: r.provider,
      platform: r.platform,
      caption: r.caption,
      image_url: r.image_url,
      shortlink: r.shortlink,
      url_canonical: r?.payload?.product?.url ?? null, // <- derivado do payload
      scheduled_at: r.scheduled_at,
      status: r.status,
    }));

    return NextResponse.json({ items });
  } catch (err: any) {
    if (err?.message === 'unauthorized') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
