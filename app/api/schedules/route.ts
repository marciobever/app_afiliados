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
      .select('id, provider, platform, caption, image_url, shortlink, scheduled_at, status')
      .eq('user_id', userId)
      .order('scheduled_at', { ascending: true });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ items: data ?? [] });
  } catch (err: any) {
    if (err?.message === 'unauthorized') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
