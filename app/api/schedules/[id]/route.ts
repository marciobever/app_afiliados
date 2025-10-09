import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// --- helpers ---
function toIso(input: unknown): string | null {
  if (input == null) return null;

  // number (epoch s/ms)
  if (typeof input === 'number') {
    const d = new Date(input > 1e12 ? input : input * 1000);
    return isNaN(+d) ? null : d.toISOString();
  }

  const s = String(input).trim();
  if (!s) return null;

  // ISO direto
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
    const d = new Date(s);
    return isNaN(+d) ? null : d.toISOString();
  }

  // YYYY-MM-DD HH:mm
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (m) {
    const [, Y, M, D, h, min] = m;
    const d = new Date(+Y, +M - 1, +D, +h, +min, 0, 0);
    return isNaN(+d) ? null : d.toISOString();
  }

  // DD/MM/YYYY HH:mm
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})[ ,T](\d{2}):(\d{2})$/);
  if (m) {
    const [, D, M, Y, h, min] = m;
    const d = new Date(+Y, +M - 1, +D, +h, +min, 0, 0);
    return isNaN(+d) ? null : d.toISOString();
  }

  // último recurso
  const d = new Date(s);
  return isNaN(+d) ? null : d.toISOString();
}

/** CANCELAR */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = requireSession();
    const nowIso = new Date().toISOString();
    const sb = supabaseAdmin().schema?.('Produto_Afiliado') ?? supabaseAdmin();

    // garante que existe e pertence ao usuário
    const { data: row, error: selErr } = await (sb as any)
      .from('Produto_Afiliado.schedules_queue')
      .select('id,status')
      .eq('id', params.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });
    if (!row)   return NextResponse.json({ error: 'not found' }, { status: 404 });
    if (!['queued','claimed'].includes(row.status)) {
      return NextResponse.json({ error: 'not cancelable' }, { status: 409 });
    }

    const { data, error } = await (sb as any)
      .from('Produto_Afiliado.schedules_queue')
      .update({ status: 'canceled', done_at: nowIso, updated_at: nowIso })
      .eq('id', params.id)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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

    // aceita scheduled_at, schedule_at, at, ou o próprio body como string/number
    const candidate = body?.scheduled_at ?? body?.schedule_at ?? body?.at ?? body;
    const iso = toIso(candidate);
    if (!iso) {
      return NextResponse.json({ error: 'scheduled_at inválido/ausente' }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const sb = supabaseAdmin().schema?.('Produto_Afiliado') ?? supabaseAdmin();

    // lê registro
    const { data: row, error: selErr } = await (sb as any)
      .from('Produto_Afiliado.schedules_queue')
      .select('id,status,payload')
      .eq('id', params.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });
    if (!row)   return NextResponse.json({ error: 'not found' }, { status: 404 });
    if (row.status !== 'queued') {
      return NextResponse.json({ error: 'apenas itens em queued podem ser reagendados' }, { status: 409 });
    }

    // atualiza payload.scheduleTime
    let payload: any = row.payload ?? {};
    try {
      if (typeof payload === 'string') payload = JSON.parse(payload);
    } catch { payload = {}; }
    payload.scheduleTime = iso;

    const { data, error } = await (sb as any)
      .from('Produto_Afiliado.schedules_queue')
      .update({
        scheduled_at: iso,
        updated_at: nowIso,
        status: 'queued',
        payload, // objeto -> jsonb
      })
      .eq('id', params.id)
      .eq('user_id', userId)
      .select('id, scheduled_at, status')
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, id: data.id, scheduled_at: data.scheduled_at, status: data.status });
  } catch (err: any) {
    if (err?.message === 'unauthorized') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
