import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer'; // ou seu helper equivalente

const ALLOWED_ORIGINS = [
  'https://seureview.com.br',
  'https://www.seureview.com.br',
];

function withCors(res: NextResponse, req: Request) {
  const origin = req.headers.get('origin') ?? '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.headers.set('Access-Control-Allow-Origin', allowed);
  res.headers.set('Access-Control-Allow-Credentials', 'true');
  res.headers.set('Access-Control-Allow-Headers', 'content-type');
  res.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.headers.set('Vary', 'Origin');
  return res;
}

export async function OPTIONS(req: Request) {
  return withCors(new NextResponse(null, { status: 204 }), req);
}

export async function GET(req: Request) {
  try {
    const supabase = supabaseServer(); // lê cookies da request
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return withCors(NextResponse.json({ ok: false }, { status: 401 }), req);
    }

    // pegue do seu "profiles" se existir; senão, do metadata / e-mail
    const display =
      (user.user_metadata as any)?.name ||
      user.email?.split('@')[0] ||
      'Usuário';

    const avatar =
      (user.user_metadata as any)?.avatar_url || null;

    return withCors(
      NextResponse.json({
        ok: true,
        id: user.id,
        email: user.email,
        name: display,
        avatar_url: avatar,
      }),
      req
    );
  } catch (e: any) {
    return withCors(
      NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 }),
      req
    );
  }
}
