import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/** CANCELAR */
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
      .in('status', ['queued', 'claimed']) // só cancela se ainda não rodou
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

/** REAGENDAR */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = requireSession();
    const body = await req.json().catch(() => ({}));
    const newIso: string | undefined = body?.scheduled_at;

    if (!newIso) {
      return NextResponse.json({ error: 'scheduled_at obrigatório (ISO)' }, { status: 400 });
    }
    const d = new Date(newIso);
    if (isNaN(+d)) {
      return NextResponse.json({ error: 'scheduled_at inválido' }, { status: 400 });
    }
    const toIso = d.toISOString();
    const nowIso = new Date().toISOString();

    const sb = supabaseAdmin().schema('Produto_Afiliado');

    // 1) carrega a linha (garante dono + status permitido)
    const { data: row, error: selErr } = await sb
      .from('schedules_queue')
      .select('id, status, payload')
      .eq('id', params.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });
    if (!row)   return NextResponse.json({ error: 'not found' }, { status: 404 });
    if (row.status !== 'queued') {
      return NextResponse.json({ error: 'apenas itens em queued podem ser reagendados' }, { status: 409 });
    }

    // 2) atualiza payload.scheduleTime também (se existir)
    let newPayload: any = row.payload ?? {};
    try {
      if (typeof newPayload === 'string') newPayload = JSON.parse(newPayload);
    } catch {
      newPayload = {};
    }
    newPayload.scheduleTime = toIso;

    const { data, error } = await sb
      .from('schedules_queue')
      .update({
        scheduled_at: toIso,
        updated_at: nowIso,
        // mantém status em 'queued'; se quiser, pode forçar 'queued'
        status: 'queued',
        payload: newPayload,
      })
      .eq('id', params.id)
      .eq('user_id', userId)
      .eq('status', 'queued')
      .select('id, scheduled_at, status')
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data)  return NextResponse.json({ error: 'not found or status changed' }, { status: 409 });

    return NextResponse.json({ ok: true, id: data.id, scheduled_at: data.scheduled_at, status: data.status });
  } catch (err: any) {
    if (err?.message === 'unauthorized') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
