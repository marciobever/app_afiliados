import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const resumeUrl = process.env.N8N_WAIT_RESUME_URL
    const secret = process.env.N8N_SECRET

    if (!resumeUrl) {
      return NextResponse.json({ error: 'N8N_WAIT_RESUME_URL not set' }, { status: 500 })
    }

    const res = await fetch(resumeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': secret || '',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `n8n responded ${res.status}: ${text}` }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
