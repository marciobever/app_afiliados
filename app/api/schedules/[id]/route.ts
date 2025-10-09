// app/api/schedules/[id]/route.ts
import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

function normalizeToIsoZ(input: string) {
  // aceita 'YYYY-MM-DDTHH:mm(:ss)?(Z|±hh:mm)?' ou 'YYYY-MM-DD HH:mm(:ss)?'
  let s = String(input).trim();
  if (!s) return null;

  const hasTZ = /[zZ]|[+-]\d{2}:\d{2}$/.test(s);
  if (!hasTZ) {
    // troca espaço por 'T' e anexa 'Z' se não tiver timezone
    s = s.replace(' ', 'T');
    if (!/[zZ]$/.test(s)) s = s + 'Z';
  }

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

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

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = requireSession();
    const body = await req.json().catch(() => ({} as any));
    const raw = body?.scheduleTime ?? body?.scheduled_at;
    const iso = typeof raw === 'string' ? normalizeToIsoZ(raw) : null;

    if (!iso) {
      return NextResponse.json(
        { error: 'invalid scheduleTime; expected ISO string' },
        { status: 400 }
      );
    }

    // (opcional) impede reagendar para o passado
    if (new Date(iso).getTime() < Date.now() - 5_000) {
      return NextResponse.json(
        { error: 'scheduleTime must be in the future' },
        { status: 400 }
      );
    }

    const sb = supabaseAdmin().schema('Produto_Afiliado');
    const { data, error } = await sb
      .from('schedules_queue')
      .update({ scheduled_at: iso, status: 'queued', updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('user_id', userId)
      .in('status', ['queued', 'claimed']) // só permite reagendar se ainda não executou
      .select('id, scheduled_at')
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data)  return NextResponse.json({ error: 'not found or not reschedulable' }, { status: 404 });

    return NextResponse.json({ ok: true, id: data.id, scheduled_at: data.scheduled_at });
  } catch (err: any) {
    if (err?.message === 'unauthorized') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
