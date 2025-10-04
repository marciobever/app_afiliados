'use client'
import { useState } from 'react'

export default function Dashboard() {
  const [term, setTerm] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function createSearch() {
    setLoading(true)
    try {
      const res = await fetch('/api/searches', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ term }) })
      const json = await res.json()
      setResult(json)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Painel — Buscas Shopee</h1>
      <div className="flex gap-2">
        <input className="border rounded px-3 py-2 w-80" placeholder="termo (ex.: fone bluetooth)"
               value={term} onChange={e=>setTerm(e.target.value)} />
        <button onClick={createSearch} disabled={!term || loading}
                className="px-4 py-2 bg-black text-white rounded">
          {loading ? 'Enviando...' : 'Criar busca'}
        </button>
      </div>
      {result && (
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
      )}
      <p className="text-sm text-gray-500">Depois que o n8n responder, os produtos serão gravados em <code>products</code>.</p>
    </main>
  )
}
