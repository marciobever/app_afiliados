// lib/orgs.ts
'use server';

import supabaseAdmin from '@/lib/supabaseAdmin';
import { createHash } from 'crypto';

function uuidFromString(input: string): string {
  const hex = createHash('sha256').update(input).digest('hex');
  const s = hex.slice(0, 32).split('');
  s[12] = '4';
  s[16] = ((parseInt(s[16], 16) & 0x3) | 0x8).toString(16);
  return `${s.slice(0,8).join('')}-${s.slice(8,12).join('')}-${s.slice(12,16).join('')}-${s.slice(16,20).join('')}-${s.slice(20,32).join('')}`;
}

const MISSING_TABLE_RX = /(schema cache)|(does not exist)|relation .* does not exist|not find the table/i;

export async function getOrCreatePrimaryOrg(userId: string, email?: string) {
  const sb = supabaseAdmin().schema('Produto_Afiliado');

  try {
    // tenta pegar um vínculo existente
    const { data, error } = await sb
      .from('org_members')
      .select('org_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (MISSING_TABLE_RX.test(error.message || '')) {
        // schema/tabela não exposta → fallback silencioso
        const fallbackOrgId = userId || uuidFromString(email || 'default');
        return { orgId: fallbackOrgId, org: null, fallback: true as const };
      }
      throw error;
    }

    if (data?.org_id) {
      return { orgId: String(data.org_id), org: null, fallback: false as const };
    }

    // não há membership → fallback simples usando o próprio userId
    const fallbackOrgId = userId || uuidFromString(email || 'default');
    return { orgId: fallbackOrgId, org: null, fallback: true as const };
  } catch (e: any) {
    // qualquer erro inesperado → ainda assim não travar o login
    const fallbackOrgId = userId || uuidFromString(email || 'default');
    return { orgId: fallbackOrgId, org: null, fallback: true as const, error: e?.message };
  }
}
