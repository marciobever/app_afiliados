export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { getUserContext } from '@/lib/auth';

export async function GET() {
  try {
    const { orgId } = getUserContext();
    if (!orgId) return NextResponse.json({ ok: true, plan: null });

    const sb = supabaseAdmin().schema('Produto_Afiliado');

    // Tenta pegar de org_subscriptions; se não existir/erro, cai no fallback
    let plan: any = null;

    try {
      const { data, error } = await sb
        .from('org_subscriptions')
        .select('plan_code, status, renews_at, trial_ends_at')
        .eq('org_id', orgId)
        .maybeSingle();
      if (!error && data) {
        plan = {
          code: data.plan_code || 'starter',
          label: (data.plan_code || 'starter').replace(/^./, (c: string) => c.toUpperCase()),
          status: data.status || 'active',
          renews_at: data.renews_at || null,
          trial_ends_at: data.trial_ends_at || null,
        };
      }
    } catch {
      // tabela pode não existir — segue fallback
    }

    if (!plan) {
      // Fallback: considera Starter/grátis
      plan = { code: 'starter', label: 'Starter', status: 'active', renews_at: null, trial_ends_at: null };
    }

    return NextResponse.json({ ok: true, plan });
  } catch (e: any) {
    console.error('[plan GET] error:', e?.message);
    return NextResponse.json({ ok: false, error: e?.message || 'internal' }, { status: 400 });
  }
}
