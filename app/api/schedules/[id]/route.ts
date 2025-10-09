// app/api/schedules/[id]/route.ts
import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = requireSession();
    const nowIso = new Date().toISOString();

    const sb = supabaseAdmin().schema('Produto_Afiliado');

    const { data, error } = await sb
      .from('schedules_queue')
      .update({ status: 'canceled', done_at: nowIso, updated_at: nowIso })
      .eq('id', params.id)
      .eq('user_id', userId)
      .in('status', ['queued', 'claimed'])
      .select('id')
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'not found or not cancelable' }, { status: 404 });

    return NextResponse.json({ ok: true, id: data.id });
  } catch (err: any) {
    if (err?.message === 'unauthorized') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = requireSession();
    const body = await req.json().catch(() => ({} as any));

    // aceita scheduled_at (preferido) ou scheduleTime (compat)
    const scheduledAt: string | undefined = body?.scheduled_at ?? body?.scheduleTime;
    if (!scheduledAt || isNaN(+new Date(scheduledAt))) {
      return NextResponse.json({ error: 'scheduled_at inválido' }, { status: 400 });
    }

    const sb = supabaseAdmin().schema('Produto_Afiliado');

    // só permite reagendar se ainda não executou
    const { data, error } = await sb
      .from('schedules_queue')
      .update({ scheduled_at: scheduledAt, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('user_id', userId)
      .in('status', ['queued', 'claimed'])
      .select('id, scheduled_at, status')
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'not found or not reschedulable' }, { status: 404 });

    return NextResponse.json({ ok: true, id: data.id, scheduled_at: data.scheduled_at, status: data.status });
  } catch (err: any) {
    if (err?.message === 'unauthorized') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
