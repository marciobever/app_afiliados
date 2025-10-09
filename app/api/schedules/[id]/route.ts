// app/api/schedules/[id]/route.ts
import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Cancela um agendamento (apenas se ainda estiver em queued).
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = requireSession();
    const nowIso = new Date().toISOString();

    const sb = supabaseAdmin().schema('Produto_Afiliado');

    const { data, error } = await sb
      .from('schedules_queue') // <- tabela dentro do schema já selecionado
      .update({ status: 'canceled', done_at: nowIso, updated_at: nowIso })
      .eq('id', params.id)
      .eq('user_id', userId)
      .eq('status', 'queued') // só cancela se ainda está na fila
      .select('id')
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data)  return NextResponse.json({ error: 'not found or not cancelable' }, { status: 404 });

    return NextResponse.json({ ok: true, id: data.id });
  } catch (err: any) {
    if (err?.message === 'unauthorized') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}

/**
 * Reagenda (mantém status em queued). Espera { scheduleTime: ISO-string } no body.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = requireSession();
    const body = await req.json().catch(() => ({}));
    const scheduleTime: string | undefined = body?.scheduleTime;

    if (!scheduleTime || isNaN(Date.parse(scheduleTime))) {
      return NextResponse.json({ error: 'scheduleTime inválido (use ISO: 2025-11-08T23:34:00.000Z)' }, { status: 400 });
    }

    const whenIso = new Date(scheduleTime).toISOString();
    const sb = supabaseAdmin().schema('Produto_Afiliado');

    const { data, error } = await sb
      .from('schedules_queue')
      .update({ scheduled_at: whenIso, status: 'queued', updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('user_id', userId)
      .eq('status', 'queued') // só reagenda se ainda está na fila
      .select('id, scheduled_at, status')
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data)  return NextResponse.json({ error: 'not found or not reschedulable' }, { status: 404 });

    return NextResponse.json({ ok: true, id: data.id, scheduled_at: data.scheduled_at, status: data.status });
  } catch (err: any) {
    if (err?.message === 'unauthorized') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
