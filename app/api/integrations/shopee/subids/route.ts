// app/api/integrations/shopee/subids/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth';

const N8N_SUBIDS_URL =
  process.env.N8N_SUBIDS_URL ||
  'https://n8n.seureview.com.br/webhook/shopee_subids';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const N8N_SUBIDS_URL =
  process.env.N8N_SUBIDS_URL || 'https://n8n.seureview.com.br/webhook/shopee_subids'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any))

    const payload = {
      base_url: body.base_url,       // URL base do produto (offer_link ou product_link)
      platform: body.platform,       // 'facebook' | 'instagram' | 'x'
      sub_profile: body.sub_profile, // perfil escolhido no Composer
      product: body.product || null, // opcional: { id, title, ... }
    }

    const r = await fetch(N8N_SUBIDS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    const text = await r.text()
    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }

    if (!r.ok) {
      return NextResponse.json(
        { error: `n8n responded ${r.status}`, data },
        { status: 502 }
      )
    }

    // Esperado: { url: 'https://...', subids_used: ['facebook','...'] }
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json(
      { error: 'subids_proxy_failed', message: e?.message },
      { status: 500 }
    )
  }
}
    const body = await req.json().catch(() => ({} as any));

    // contexto opcional do usuário/organização
    let userId = '';
    let orgId = '';
    try {
      const ctx = getUserContext() as any;
      userId = ctx?.userId ?? ctx?.userIdNorm ?? '';
      orgId = ctx?.orgId ?? '';
    } catch {
      /* segue sem sessão */
    }

    // payload mínimo esperado pelo workflow 2
    const payload = {
      base_url: body.base_url,          // URL base (offer_link/product_link)
      platform: body.platform,          // 'facebook' | 'instagram' | 'x'
      product: body.product ?? null,    // opcional, mas útil p/ subIDs
      userId,
      orgId,
    };

    const r = await fetch(N8N_SUBIDS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.N8N_SECRET ? { 'x-api-key': process.env.N8N_SECRET } : {}),
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const text = await r.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!r.ok) {
      return NextResponse.json(
        { error: 'n8n_request_failed', detail: data },
        { status: 502 }
      );
    }

    // normalização do retorno
    const url =
      data?.url ||
      data?.shortLink ||
      data?.data?.url ||
      data?.items?.[0]?.url ||
      data?.data?.generateShortLink?.shortLink ||
      '';

    const subids =
      data?.subids_used ||
      data?.subIds ||
      data?.subids ||
      data?.info?.subids ||
      [];

    return NextResponse.json({ url, subids_used: subids }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'subids_proxy_failed', message: e?.message || String(e) },
      { status: 500 }
    );
  }
}
