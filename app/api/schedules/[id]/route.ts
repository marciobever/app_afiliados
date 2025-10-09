// app/api/schedules/[id]/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = supabaseServer();
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from('Produto_Afiliado.schedules_queue')
    .update({ status: 'canceled', done_at: nowIso, updated_at: nowIso })
    .eq('id', params.id)
    .eq('user_id', user.user.id)
    .in('status', ['queued', 'claimed']) // só cancela se ainda não rodou
    .select('id')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data)  return NextResponse.json({ error: 'not found or not cancelable' }, { status: 404 });

  return NextResponse.json({ ok: true, id: data.id });
}
