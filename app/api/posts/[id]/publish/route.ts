import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(_: Request, { params }: { params: { id: string } }) {
  await fetch(process.env.N8N_PUBLISH_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.N8N_SECRET! },
    body: JSON.stringify({ post_id: params.id })
  }).catch(() => {})
  return NextResponse.json({ ok:true })
}
