// app/api/me/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

const ALLOWED_ORIGINS = [
  'https://seureview.com.br',
  'https://www.seureview.com.br',
  process.env.NEXT_PUBLIC_SITE_ORIGIN || '',
].filter(Boolean);

function corsHeaders(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : (ALLOWED_ORIGINS[0] || '*');
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    Vary: 'Origin',
  };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

export async function GET(req: Request) {
  const headers = corsHeaders(req.headers.get('origin'));
  try {
    // ⚠️ import adiado: evita avaliar envs no build
    const sbMod = await import('@/lib/supabaseServer');
    const sb: any = (sbMod as any).default ?? (sbMod as any).supabaseServer ?? sbMod;

    if (!sb?.auth?.getUser) {
      // não explode no build/runtime sem envs
      return NextResponse.json({ ok: false }, { status: 200, headers });
    }

    const { data, error } = await sb.auth.getUser();
    if (error || !data?.user) {
      return NextResponse.json({ ok: false }, { status: 200, headers });
    }

    const u: any = data.user;
    const name =
      u?.user_metadata?.name ||
      u?.user_metadata?.full_name ||
      u?.email?.split('@')[0] ||
      'Usuário';

    const avatar_url = u?.user_metadata?.avatar_url || u?.user_metadata?.picture || null;

    return NextResponse.json(
      { ok: true, id: u.id, name, email: u.email ?? null, avatar_url },
      { status: 200, headers }
    );
  } catch (e: any) {
    // nunca derruba o build
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 200, headers });
  }
}
