import { NextRequest, NextResponse } from 'next/server'

/**
 * Retorna a lista de PERFIS de SubID disponíveis para o usuário.
 * Você pode:
 *  - A) Proxiar para um webhook no n8n (N8N_SUBID_PROFILES_URL)
 *  - B) Usar um fallback estático (ex.: ["default","ads","influencer"])
 */
export const dynamic = 'force-dynamic'

const N8N_SUBID_PROFILES_URL =
  process.env.N8N_SUBID_PROFILES_URL || '' // opcional: ex. https://n8n.seureview.com.br/webhook/shopee_subid_profiles

export async function GET(_: NextRequest) {
  try {
    if (N8N_SUBID_PROFILES_URL) {
      const r = await fetch(N8N_SUBID_PROFILES_URL, { method: 'GET', cache: 'no-store' })
      const text = await r.text()
      let data: any
      try {
        data = JSON.parse(text)
      } catch {
        data = { raw: text }
      }
      if (!r.ok) {
        return NextResponse.json({ error: `n8n responded ${r.status}`, data }, { status: 502 })
      }
      // Esperado do n8n: { profiles: ["default","facebook_ads","influencer_joao"] }
      const profiles = Array.isArray(data?.profiles) ? data.profiles : []
      return NextResponse.json({ profiles })
    }

    // Fallback local simples
    return NextResponse.json({
      profiles: ['default', 'facebook_ads', 'instagram_organic', 'influencer']
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: 'profiles_failed', message: e?.message || String(e) },
      { status: 500 }
    )
  }
}
