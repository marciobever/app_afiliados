// app/api/schedules/[id]/route.ts
import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/** Cancela um agendamento (se ainda não executado). */
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
    if (!data) return NextResponse.json({ error: 'not found or not cancelable' }, { status: 404 });

    // TODO: se você guarda execução do n8n, cancele lá também:
    // if (data.n8n_execution_id) {
    //   await fetch(process.env.N8N_CANCEL_WEBHOOK!, {
    //     method: 'POST',
    //     headers: { 'content-type': 'application/json' },
    //     body: JSON.stringify({ executionId: data.n8n_execution_id }),
    //   });
    // }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (err: any) {
    if (err?.message === 'unauthorized') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}

/** Reagenda: altera o scheduled_at e devolve para 'queued'. */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = requireSession();
    const body = (await req.json().catch(() => ({}))) as {
      scheduled_at?: string;     // preferido
      schedule_at?: string;
      scheduleTime?: string;     // aceito também
    };

    const candidate =
      body.scheduled_at ?? body.schedule_at ?? body.scheduleTime;

    if (!candidate || typeof candidate !== 'string') {
      return NextResponse.json({ error: 'scheduled_at inválido' }, { status: 400 });
    }

    // Validar rapidamente (deve ser ISO válido)
    const d = new Date(candidate);
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: 'datetime inválido' }, { status: 400 });
    }
    const newIso = d.toISOString(); // armazenamos sempre em UTC ISO

    const nowIso = new Date().toISOString();
    const sb = supabaseAdmin().schema('Produto_Afiliado');

    const { data, error } = await sb
      .from('schedules_queue')
      .update({
        scheduled_at: newIso,
        status: 'queued',     // volta para a fila
        claimed_at: null,     // limpa locks
        worker_id: null,
        done_at: null,
        updated_at: nowIso,
        // Se quiser refletir também no payload: use um trigger no DB,
        // ou faça outra query com jsonb_set. Mantive simples aqui.
      })
      .eq('id', params.id)
      .eq('user_id', userId)
      .in('status', ['queued', 'claimed', 'error'])
      .select('id, scheduled_at, status')
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'not found or not editable' }, { status: 404 });

    return NextResponse.json({
      ok: true,
      id: data.id,
      scheduled_at: data.scheduled_at,
      status: data.status,
    });
  } catch (err: any) {
    if (err?.message === 'unauthorized') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
