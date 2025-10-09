// app/api/schedules/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status'); // queued|claimed|error|done|canceled|all
  const supabase = supabaseServer();

  const { data: user } = await supabase.auth.getUser();
  if (!user?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let query = supabase
    .from('Produto_Afiliado.schedules_queue')
    .select('id, provider, platform, caption, image_url, shortlink, url_canonical, scheduled_at, status')
    .eq('user_id', user.user.id)
    .order('scheduled_at', { ascending: true });

  if (status && status !== 'all') query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data ?? [] });
}
