import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const term = body?.term as string
  const filters = body?.filters ?? {}

  if (!term) return NextResponse.json({ ok:false, error:'term is required' }, { status: 400 })

  const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  const { data, error } = await supa.from('searches').insert({ term, filters }).select().single()
  if (error) return NextResponse.json({ ok:false, error: error.message }, { status: 500 })

  // dispara n8n
  await fetch(process.env.N8N_SEARCH_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.N8N_SECRET! },
    body: JSON.stringify({ search_id: data.id, term, filters })
  }).catch(() => {})

  return NextResponse.json({ ok:true, data })
}
