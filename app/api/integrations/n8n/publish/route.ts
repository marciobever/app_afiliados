import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const N8N_PUBLISH_URL =
  process.env.N8N_PUBLISH_URL || 'https://n8n.seureview.com.br/webhook/publish_social'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any))
    // body esperado: { platform, product, trackedUrl, subidsUsed, caption, scheduleTime | null }

    const r = await fetch(N8N_PUBLISH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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

    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json(
      { error: 'publish_proxy_failed', message: e?.message },
      { status: 500 }
    )
  }
}
