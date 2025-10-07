'use client';

import { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Search as SearchIcon } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui';

type Row = {
  id?: string;
  term?: string;            // termo buscado
  market?: string;          // ex: "shopee"
  total?: number;           // total de itens retornados na ocasião
  createdAt?: string;       // ISO
  channel?: string;         // "instagram" | "facebook" | etc (opcional)
};

function timeAgo(iso?: string) {
  if (!iso) return '—';
  try {
    const d = new Date(iso).getTime();
    const diffSec = Math.round((Date.now() - d) / 1000);
    const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

    const map: Array<[number, Intl.RelativeTimeFormatUnit]> = [
      [60, 'second'],
      [60, 'minute'],
      [24, 'hour'],
      [7, 'day'],
      [4.345, 'week'],
      [12, 'month'],
      [Number.POSITIVE_INFINITY, 'year'],
    ];

    let unit: Intl.RelativeTimeFormatUnit = 'second';
    let value = -diffSec;
    let div = 1;

    for (const [factor, u] of map) {
      if (Math.abs(value) < factor) {
        unit = u;
        break;
      }
      value = value / factor;
      div *= factor;
    }
    return rtf.format(Math.round(value), unit);
  } catch {
    return new Date(iso!).toLocaleString('pt-BR');
  }
}

export default function History({ market }: { market: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  // carrega histórico
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const r = await fetch(`/api/searches?market=${market}`, { cache: 'no-store' });
        const data = await r.json().catch(() => null);

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
      // usa a mesma API dos produtos — POST + payload simples
      await fetch(`/api/search/${market}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: term,
          filters: { limit: 24 },
          sort: 'relevance',
          country: 'BR',
        }),
      });

      alert('Busca disparada! Volte para a aba Produtos para ver os resultados.');
    } catch {
      alert('Falha ao repetir a busca.');
    }
  }

  if (loading) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-gray-600">Carregando histórico…</p>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-red-600">{error}</p>
        </CardBody>
      </Card>
    );
  }

  if (!filtered.length) {
    return (
      <Card>
        <CardHeader title="Histórico de buscas" />
        <CardBody>
          <p className="text-sm text-gray-600">
            Ainda não há buscas registradas para este marketplace.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Histórico de buscas"
        right={
          <div className="relative">
            <SearchIcon className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filtrar por termo…"
              className="pl-8 pr-3 py-2 text-sm rounded-lg border border-[#FFD9CF] focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D]"
            />
          </div>
        }
      />
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white">
            <tr className="text-left border-b">
              <th className="px-4 py-2 font-medium text-gray-500">Termo</th>
              <th className="px-4 py-2 font-medium text-gray-500">Marketplace</th>
              <th className="px-4 py-2 font-medium text-gray-500">Itens</th>
              <th className="px-4 py-2 font-medium text-gray-500">Canal</th>
              <th className="px-4 py-2 font-medium text-gray-500">Quando</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((r, idx) => (
              <tr key={r.id ?? `${r.term}-${idx}`}>
                <td className="px-4 py-2">{r.term || '—'}</td>
                <td className="px-4 py-2 capitalize">{r.market || market}</td>
                <td className="px-4 py-2">{typeof r.total === 'number' ? r.total : '—'}</td>
                <td className="px-4 py-2">{r.channel || '—'}</td>
                <td className="px-4 py-2 whitespace-nowrap">{timeAgo(r.createdAt)}</td>
                <td className="px-4 py-2">
                  <button
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-[#FFD9CF] hover:bg-[#FFF4F0]"
                    onClick={() => repeatSearch(r.term)}
                    title="Repetir busca"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Repetir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
