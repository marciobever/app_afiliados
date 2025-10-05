// app/api/integrations/n8n/publish/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

// Se você usa outra lib de auth, troque aqui:
import { getUserContext } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Use o webhook "social" (o que você mostrou). Pode sobrescrever via ENV.
const N8N_PUBLISH_URL =
  process.env.N8N_PUBLISH_URL || 'https://n8n.seureview.com.br/webhook/social'

// --- DB pool (Postgres) ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // opcional: ssl: { rejectUnauthorized: false },
})

// Busca a integração META (Facebook/Instagram) mais recente por user_id
async function getMetaIntegrationByUser(userId: string) {
  const q = `
    SELECT
      provider,
      meta_user_id,
      access_token,
      instagram_business_id,
      instagram_username,
      page_id,
      page_name,
      granted_scopes,
      obtained_at,
      expires_in
    FROM social_integrations
    WHERE user_id = $1
      AND provider = 'meta'
    ORDER BY obtained_at DESC NULLS LAST, updated_at DESC NULLS LAST
    LIMIT 1;
  `
  const { rows } = await pool.query(q, [userId])
  return rows[0] || null
}

// Tipos locais
type PlatformKey = 'facebook' | 'instagram' | 'x'

type Product = {
  id: string
  title: string
  price?: number | null
  rating?: number | null
  image?: string
  url: string
}

// Util: normaliza product (garante id e campos básicos)
function deriveShopeeIdFromUrl(url?: string): string {
  if (!url) return ''
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean)
    const idx = parts.findIndex((p) => p.toLowerCase() === 'product')
    if (idx >= 0 && parts[idx + 1] && parts[idx + 2]) {
      return `${parts[idx + 1]}_${parts[idx + 2]}`
    }
  } catch {}
  return ''
}

function ensureSafeProduct(baseUrl: string, p?: Product | null): Product {
  const id =
    (p?.id && String(p.id)) ||
    deriveShopeeIdFromUrl(p?.url || baseUrl) ||
    deriveShopeeIdFromUrl(baseUrl)

  return {
    id,
    title: p?.title ?? '',
    price:
      typeof p?.price === 'number'
        ? p.price
        : p?.price != null
        ? Number(p.price as any)
        : null,
    rating:
      typeof p?.rating === 'number'
        ? p.rating
        : p?.rating != null
        ? Number(p.rating as any)
        : null,
    image: p?.image ?? '',
    url: p?.url ?? baseUrl,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any))

    // Esperado do front:
    // { platform, product, trackedUrl, caption, scheduleTime | null, context? }
    const platform = String(body.platform || '').toLowerCase() as PlatformKey
    const caption = String(body.caption || '')
    const trackedUrl = String(body.trackedUrl || body.link || '')
    const scheduleTime: string | null =
      body.scheduleTime != null ? String(body.scheduleTime) : null

    // product pode vir incompleto; normalizamos
    const product = ensureSafeProduct(body?.product?.url || '', body.product)

    // validações mínimas
    if (!platform || !['facebook', 'instagram'].includes(platform)) {
      return NextResponse.json(
        { error: 'invalid_platform', message: 'Use "facebook" ou "instagram".' },
        { status: 400 }
      )
    }
    if (!caption) {
      return NextResponse.json(
        { error: 'missing_caption' },
        { status: 400 }
      )
    }
    if (!trackedUrl) {
      return NextResponse.json(
        { error: 'missing_tracked_url' },
        { status: 400 }
      )
    }

    // Contexto do usuário logado (para buscar credenciais)
    let userId = ''
    let orgId = ''
    try {
      const ctx = getUserContext() as any
      userId = ctx?.userId ?? ctx?.userIdNorm ?? ''
      orgId = ctx?.orgId ?? ''
    } catch {
      // segue sem sessão – mas pra publicar a gente precisa das credenciais
    }
    if (!userId) {
      return NextResponse.json(
        { error: 'unauthenticated', message: 'Sessão não encontrada.' },
        { status: 401 }
      )
    }

    // Busca integração META do usuário
    const integ = await getMetaIntegrationByUser(userId)
    if (!integ) {
      return NextResponse.json(
        { error: 'meta_integration_not_found', message: 'Vincule sua conta do Facebook/Instagram nas Configurações.' },
        { status: 400 }
      )
    }

    const access_token: string = integ.access_token
    const ig_business_id: string | null = integ.instagram_business_id || null
    const fb_page_id: string | null = integ.page_id || null

    // Provider de destino que o n8n espera:
    // - "instagram": publish via IG Graph (requires ig_business_id)
    // - "meta": publish via FB Page (requires fb_page_id)
    const provider = platform === 'instagram' ? 'instagram' : 'meta'

    // Escolhe imagem (se não houver, o n8n pode tentar publicar só texto+link no FB)
    const image_url: string | undefined =
      product.image || undefined

    // payload final para o webhook do n8n
    const payloadForN8n: Record<string, any> = {
      provider,            // "instagram" ou "meta"
      caption,
      image_url,           // opcional para FB; obrigatório para IG se publicar imagem
      access_token,
      ig_business_id: provider === 'instagram' ? ig_business_id : null,
      fb_page_id: provider === 'meta' ? fb_page_id : null,

      // contexto útil
      platform,            // 'facebook' | 'instagram'
      link: trackedUrl,    // mantemos como "link" também, caso o fluxo use
      product,
      scheduleTime: scheduleTime || null,
      context: {
        source: 'composer',
        ts: new Date().toISOString(),
        userId,
        orgId,
        productId: product.id,
        productUrl: product.url,
      },
    }

    // validações finais por destino (evita 400 no n8n sem motivo claro)
    const missing: string[] = []
    if (!access_token) missing.push('access_token')
    if (provider === 'instagram') {
      if (!ig_business_id) missing.push('ig_business_id')
      if (!image_url) missing.push('image_url') // IG exige mídia
    } else {
      if (!fb_page_id) missing.push('fb_page_id')
      // FB pode publicar só texto+link; image_url é opcional
    }
    if (missing.length) {
      return NextResponse.json(
        { error: 'missing_credentials', missing },
        { status: 400 }
      )
    }

    // Envia para o n8n
    const r = await fetch(N8N_PUBLISH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadForN8n),
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

    return NextResponse.json(data, { status: 200 })
  } catch (e: any) {
    return NextResponse.json(
      { error: 'publish_proxy_failed', message: e?.message || String(e) },
      { status: 500 }
    )
  }
}
