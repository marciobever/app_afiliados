'use client';

import { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';

type Row = {
  id?: string;
  term?: string;            // termo buscado
  market?: string;          // ex: "shopee"
  total?: number;           // total de itens retornados na ocasião
  createdAt?: string;       // ISO
  channel?: string;         // opcional: "instagram" | "facebook" | etc
};

export default function History({ market }: { market: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Esta rota já existe no projeto (apareceu no build). Filtramos por marketplace.
        const r = await fetch(`/api/searches?market=${market}`, { cache: 'no-store' });
        const data = await r.json().catch(() => null);

        // Tolerante ao formato: aceita {data: []} ou []
        const list: Row[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        if (!cancel) setRows(list);
      } catch (e) {
        if (!cancel) setError('Não foi possível carregar o histórico.');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [market]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => (r.term || '').toLowerCase().includes(s));
  }, [rows, q]);

  async function repeatSearch(term?: string) {
    if (!term) return;
    try {
      // dispara uma nova busca no backend (rota existente no build)
      await fetch(`/api/search/shopee?q=${encodeURIComponent(term)}`, { cache: 'no-store' });
      // feedback simples
      alert('Busca disparada! Abra a aba Produtos para ver os resultados atualizados.');
    } catch {
      alert('Falha ao repetir a busca.');
    }
  }

  if (loading) {
    return (
      <div className="border rounded-xl p-6">
        <p className="text-sm text-gray-600">Carregando histórico…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-xl p-6">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!filtered.length) {
    return (
      <div className="border rounded-xl p-6 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Histórico de buscas</h2>
        </div>
        <p className="text-sm text-gray-600">
          Ainda não há buscas registradas para este marketplace.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-3 border-b bg-[#FFF7F5]">
        <h2 className="font-semibold">Histórico de buscas</h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filtrar por termo…"
            className="pl-8 pr-3 py-1.5 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white">
            <tr className="text-left border-b">
              <th className="px-3 py-2 font-medium text-gray-500">Termo</th>
              <th className="px-3 py-2 font-medium text-gray-500">Marketplace</th>
              <th className="px-3 py-2 font-medium text-gray-500">Itens</th>
              <th className="px-3 py-2 font-medium text-gray-500">Canal</th>
              <th className="px-3 py-2 font-medium text-gray-500">Quando</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((r, idx) => {
              const when = r.createdAt
                ? new Date(r.createdAt).toLocaleString()
                : '—';
              return (
                <tr key={r.id ?? `${r.term}-${idx}`}>
                  <td className="px-3 py-2">{r.term || '—'}</td>
                  <td className="px-3 py-2 capitalize">{r.market || market}</td>
                  <td className="px-3 py-2">{typeof r.total === 'number' ? r.total : '—'}</td>
                  <td className="px-3 py-2">{r.channel || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{when}</td>
                  <td className="px-3 py-2">
                    <button
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-[#FFF4F0]"
                      onClick={() => repeatSearch(r.term)}
                      title="Repetir busca"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Repetir
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
