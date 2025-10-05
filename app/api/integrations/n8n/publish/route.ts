// app/api/integrations/n8n/publish/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getUserContext } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Aceita os dois nomes de ENV, priorizando N8N_PUBLISH_URL
const N8N_PUBLISH_URL =
  process.env.N8N_PUBLISH_URL ||
  process.env.N8N_PUBLISH_WEBHOOK_URL || // fallback
  'https://n8n.seureview.com.br/webhook/social'

// -------------- Postgres (pool singleton) --------------
function getPool() {
  const key = '__pg_pool__'
  const g = globalThis as any
  if (!g[key]) {
    g[key] = new Pool({
      connectionString: process.env.DATABASE_URL,
      // ssl: { rejectUnauthorized: false }, // habilite se precisar
    })
  }
  return g[key] as Pool
}
const pool = getPool()

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
      expires_in,
      updated_at
    FROM social_integrations
    WHERE user_id = $1
      AND provider = 'meta'
    ORDER BY obtained_at DESC NULLS LAST, updated_at DESC NULLS LAST
    LIMIT 1;
  `
  const { rows } = await pool.query(q, [userId])
  return rows[0] || null
}

// -------------------- Tipos --------------------
type PlatformKey = 'facebook' | 'instagram' | 'x'
type Product = {
  id: string
  title: string
  price?: number | null
  rating?: number | null
  image?: string
  url: string
}

// -------------------- Helpers --------------------
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

// -------------------- Handler --------------------
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

    const product = ensureSafeProduct(body?.product?.url || '', body.product)

    // Validações mínimas
    if (!platform || !['facebook', 'instagram'].includes(platform)) {
      return NextResponse.json(
        { error: 'invalid_platform', message: 'Use "facebook" ou "instagram".' },
        { status: 400 }
      )
    }
    if (!caption) {
      return NextResponse.json({ error: 'missing_caption' }, { status: 400 })
    }
    if (!trackedUrl) {
      return NextResponse.json({ error: 'missing_tracked_url' }, { status: 400 })
    }

    // Usuário logado para buscar credenciais
    let userId = ''
    let orgId = ''
    try {
      const ctx = getUserContext() as any
      userId = ctx?.userId ?? ctx?.userIdNorm ?? ''
      orgId = ctx?.orgId ?? ''
    } catch {}

    if (!userId) {
      return NextResponse.json(
        { error: 'unauthenticated', message: 'Sessão não encontrada.' },
        { status: 401 }
      )
    }

    // Busca integração META
    const integ = await getMetaIntegrationByUser(userId)
    if (!integ) {
      return NextResponse.json(
        {
          error: 'meta_integration_not_found',
          message: 'Vincule sua conta do Facebook/Instagram nas Configurações.',
        },
        { status: 400 }
      )
    }

    const access_token: string = integ.access_token
    const ig_business_id: string | null = integ.instagram_business_id || null
    const fb_page_id: string | null = integ.page_id || null

    // Provider esperado pelo n8n:
    // - "instagram" => IG Graph (precisa de ig_business_id + imagem)
    // - "meta"      => Página FB (precisa de fb_page_id)
    const provider = platform === 'instagram' ? 'instagram' : 'meta'

    const image_url: string | undefined = product.image || undefined

    const payloadForN8n: Record<string, any> = {
      provider,
      caption,
      image_url, // IG exige imagem; FB pode publicar só texto+link
      access_token,
      ig_business_id: provider === 'instagram' ? ig_business_id : null,
      fb_page_id: provider === 'meta' ? fb_page_id : null,

      // contexto útil
      platform, // 'facebook' | 'instagram'
      link: trackedUrl,
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

    // Checagens finais para evitar 400 no n8n
    const missing: string[] = []
    if (!access_token) missing.push('access_token')
    if (provider === 'instagram') {
      if (!ig_business_id) missing.push('ig_business_id')
      if (!image_url) missing.push('image_url')
    } else {
      if (!fb_page_id) missing.push('fb_page_id')
    }
    if (missing.length) {
      return NextResponse.json(
        { error: 'missing_credentials', missing },
        { status: 400 }
      )
    }

    // Envia ao n8n (inclui x-api-key se existir)
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (process.env.N8N_SECRET) headers['x-api-key'] = process.env.N8N_SECRET

    const r = await fetch(N8N_PUBLISH_URL, {
      method: 'POST',
      headers,
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
