export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth';

const BILLING_PORTAL_URL = process.env.BILLING_PORTAL_URL; // ex.: link do portal/checkout

export async function POST() {
  try {
    const { orgId } = getUserContext();
    if (!orgId) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

    if (!BILLING_PORTAL_URL) {
      return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 400 });
    }

    // Você pode anexar querystring com orgId se quiser identificar no portal:
    const url = new URL(BILLING_PORTAL_URL);
    url.searchParams.set('org', orgId);
    return NextResponse.json({ ok: true, url: url.toString() });
  } catch (e: any) {
    console.error('[billing portal] error:', e?.message);
    return NextResponse.json({ ok: false, error: e?.message || 'internal' }, { status: 400 });
  }
}
