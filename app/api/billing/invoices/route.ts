export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { getUserContext } from '@/lib/auth';

export async function GET() {
  try {
    const { orgId } = getUserContext();
    if (!orgId) return NextResponse.json({ ok: true, invoices: [] });

    const sb = supabaseAdmin().schema('Produto_Afiliado');

    let invoices: any[] = [];
    try {
      const { data, error } = await sb
        .from('invoices')
        .select('id, number, created_at, amount, currency, status, hosted_invoice_url')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) invoices = data;
    } catch {
      // tabela pode não existir
    }

    return NextResponse.json({ ok: true, invoices });
  } catch (e: any) {
    console.error('[invoices GET] error:', e?.message);
    return NextResponse.json({ ok: false, error: e?.message || 'internal' }, { status: 400 });
  }
}
