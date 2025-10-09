import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/** DELETE /api/schedules/:id  -> cancela (apenas queued|claimed) */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
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
      .select('id, n8n_execution_id')
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data)  return NextResponse.json({ error: 'not found or not cancelable' }, { status: 404 });

    // Se você guardar execuções do n8n aqui, acione o cancelamento lá também.
    // if (data.n8n_execution_id) { ... }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (err: any) {
    if (err?.message === 'unauthorized') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}

/** PATCH /api/schedules/:id  -> reagenda (apenas queued|claimed)
 *  Body: { scheduleTime: string } // ISO: "2025-10-12T21:40:00.000Z"
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = requireSession();
    const sb = supabaseAdmin().schema('Produto_Afiliado');

    const body = await req.json().catch(() => ({}));
    const scheduleTime = typeof body?.scheduleTime === 'string' ? body.scheduleTime.trim() : '';

    if (!scheduleTime) {
      return NextResponse.json({ error: 'scheduleTime obrigatório (ISO)' }, { status: 400 });
    }
    const d = new Date(scheduleTime);
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: 'scheduleTime inválido' }, { status: 400 });
    }

    // 1) carrega a linha atual para validar status e pegar o payload
    const current = await sb
      .from('schedules_queue')
      .select('id, status, payload')
      .eq('id', params.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (current.error) {
      return NextResponse.json({ error: current.error.message }, { status: 500 });
    }
    if (!current.data) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }
    if (!['queued', 'claimed'].includes(current.data.status as string)) {
      return NextResponse.json({ error: 'somente itens queued|claimed podem ser reagendados' }, { status: 409 });
    }

    // 2) atualiza payload.scheduleTime no JSONB (string ISO) e scheduled_at/status
    const nowIso = new Date().toISOString();
    const newPayload = {
      ...(current.data.payload ?? {}),
      scheduleTime, // mantemos a string ISO no payload
    };

    const { data, error } = await sb
      .from('schedules_queue')
      .update({
        scheduled_at: scheduleTime,     // timestamptz no banco
        status: 'queued',               // volta para queued se estava claimed
        updated_at: nowIso,
        payload: newPayload as any,     // PostgREST converte para jsonb
      })
      .eq('id', params.id)
      .eq('user_id', userId)
      .select('id, scheduled_at, status')
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      ok: true,
      id: data?.id,
      scheduled_at: data?.scheduled_at,
      status: data?.status,
    });
  } catch (err: any) {
    if (err?.message === 'unauthorized') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
