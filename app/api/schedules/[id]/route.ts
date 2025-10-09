// app/api/schedules/[id]/route.ts
import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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

    // TODO opcional: cancelar execução no n8n se você salvar o id
    // if (data.n8n_execution_id) { ... }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (err: any) {
    if (err?.message === 'unauthorized') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = requireSession();
    const body = await req.json().catch(() => ({} as any));
    const scheduled_at_raw: string | null =
      body?.scheduled_at ?? body?.scheduleTime ?? null;

    if (!scheduled_at_raw) {
      return NextResponse.json({ error: 'scheduled_at required' }, { status: 400 });
    }

    // Aceita ISO ou “YYYY-MM-DD HH:mm” local => armazena como timestamptz
    function parseToIsoZ(input: string): string | null {
      const t = input.trim();
      if (/^\d{4}-\d{2}-\d{2}T/.test(t)) {
        // ISO vindo do cliente
        const d = new Date(t);
        return isNaN(+d) ? null : d.toISOString();
      }
      // "YYYY-MM-DD HH:mm"
      const m = t.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
      if (m) {
        const [_, Y, M, D, h, mnt] = m;
        const d = new Date(
          Number(Y),
          Number(M) - 1,
          Number(D),
          Number(h),
          Number(mnt),
          0,
          0
        );
        return isNaN(+d) ? null : d.toISOString();
      }
      return null;
      }

    const iso = parseToIsoZ(scheduled_at_raw);
    if (!iso) {
      return NextResponse.json({ error: 'invalid schedule format' }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const sb = supabaseAdmin().schema('Produto_Afiliado');

    const { data, error } = await sb
      .from('schedules_queue')
      .update({
        scheduled_at: iso,
        status: 'queued',
        done_at: null,
        updated_at: nowIso,
      })
      .eq('id', params.id)
      .eq('user_id', userId)
      .select('id, scheduled_at, status')
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data)  return NextResponse.json({ error: 'not found' }, { status: 404 });

    return NextResponse.json({ ok: true, id: data.id, scheduled_at: data.scheduled_at, status: data.status });
  } catch (err: any) {
    if (err?.message === 'unauthorized') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
