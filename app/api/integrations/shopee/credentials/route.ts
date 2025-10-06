// app/api/integrations/shopee/credentials/route.ts
import 'server-only';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { getUserContext } from '@/lib/auth';

const SB = () => supabaseAdmin().schema('Produto_Afiliado');
const MISSING =
  /(schema cache)|(does not exist)|relation .* does not exist|not find the table/i;

const j = (data: any, status = 200) => NextResponse.json(data, { status });

/** Garante que exista um registro na tabela Produto_Afiliado.orgs para a org atual (ignora erros não-críticos). */
async function ensureOrg(orgId: string) {
  const sb = SB();

  // tenta achar
  const sel = await sb.from('orgs').select('id').eq('id', orgId).maybeSingle();
  if (sel.error) {
    // se schema/tabela ainda não publicados, não quebra o fluxo
    if (MISSING.test(sel.error.message || '')) return;
    // outro erro real
    throw new Error(`Falha ao verificar orgs: ${sel.error.message}`);
  }
  if (sel.data) return;

  // tenta criar (se houver FKs/uniques diferentes no seu schema, ajuste as colunas)
  const ins = await sb
    .from('orgs')
    .insert({
      id: orgId,
      name: 'Default',
      slug: `org-${orgId.slice(0, 8)}`,
    })
    .select('id')
    .maybeSingle();

  // conflitos/uniques/etc não precisam derrubar a request
  if (ins.error && !MISSING.test(ins.error.message || '')) {
    // opcional: console.warn('[ensureOrg] insert orgs:', ins.error.message);
  }
}

// GET: carrega credenciais (NÃO retorna o secret)
export async function GET() {
  try {
    const { orgId } = getUserContext();
    if (!orgId) return j({ error: 'unauthorized' }, 401);

    await ensureOrg(orgId);

    const r = await SB()
      .from('shopee_credentials')
      .select('app_id, region, active, updated_at')
      .eq('org_id', orgId)
      .maybeSingle();

    if (r.error) {
      if (MISSING.test(r.error.message || '')) {
        return j({ credentials: null, fallback: true });
      }
      return j({ error: r.error.message }, 500);
    }

    return j({ credentials: r.data || null });
  } catch (e: any) {
    return j({ error: e?.message || String(e) }, 500);
  }
}

// PUT: cria/atualiza credenciais (só sobrescreve o secret se for enviado)
export async function PUT(req: NextRequest) {
  try {
    const { orgId } = getUserContext();
    if (!orgId) return j({ error: 'unauthorized' }, 401);

    await ensureOrg(orgId);

    const body = (await req.json().catch(() => ({}))) as any;

    const appId = body.appId ? String(body.appId).trim() : '';
    const region = (body.region ? String(body.region) : 'BR').toUpperCase();
    const active = Boolean(body.active ?? true);

    const secretProvided =
      body.secret !== undefined &&
      body.secret !== null &&
      String(body.secret).trim() !== '';

    // precisa ter pelo menos um campo para salvar/atualizar
    if (!appId && !secretProvided) {
      return j({ error: 'appId ou secret obrigatórios' }, 400);
    }

    const payload: Record<string, any> = {
      org_id: orgId,
      app_id: appId || undefined, // evita sobrescrever com vazio
      region,
      active,
      updated_at: new Date().toISOString(),
    };
    if (secretProvided) payload.secret = String(body.secret);

    const r = await SB()
      .from('shopee_credentials')
      .upsert(payload, { onConflict: 'org_id' })
      .select('app_id, region, active')
      .single();

    if (r.error) {
      if (MISSING.test(r.error.message || '')) {
        return j(
          { error: 'schema_unavailable', message: r.error.message, fallback: true },
          503
        );
      }
      return j({ error: r.error.message }, 500);
    }

    return j({ ok: true, credentials: r.data });
  } catch (e: any) {
    return j({ error: e?.message || String(e) }, 500);
  }
}
