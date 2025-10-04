'use client'
import { useState } from 'react'

export function SearchForm({ onCreated }:{ onCreated: (json:any)=>void }){
  const [term, setTerm] = useState('')
  const [loading, setLoading] = useState(false)
  async function go(){
    setLoading(true)
    const res = await fetch('/api/searches', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ term }) })
    const json = await res.json(); onCreated(json); setLoading(false)
  }
  return (
    <div className="flex gap-2">
      <input className="border rounded px-3 py-2 w-80" value={term} onChange={e=>setTerm(e.target.value)} placeholder="termo"/>
      <button onClick={go} disabled={!term||loading} className="px-4 py-2 bg-black text-white rounded">{loading?'...':'Buscar'}</button>
    </div>
  )
}
