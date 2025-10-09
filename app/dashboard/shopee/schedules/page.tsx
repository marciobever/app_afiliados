// app/api/schedules/route.ts
import { NextResponse } from 'next/server';
import { sbAdmin } from '@/lib/supabaseServer';
import { getUserContext } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status'); // queued|claimed|error|done|canceled|all

  const { userId } = getUserContext();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let query = sbAdmin
    .from('Produto_Afiliado.schedules_queue')
    .select('id, provider, platform, caption, image_url, shortlink, scheduled_at, status')
    .eq('user_id', userId)
    .order('scheduled_at', { ascending: true });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data ?? [] });
}
