'use client';

import * as React from 'react';
import Link from 'next/link';
import { SectionHeader } from '@/components/ui';
import {
  ArrowLeft, RefreshCw, Loader2, CalendarClock, XCircle,
} from 'lucide-react';

type SchedItem = {
  id: string;
  provider: 'instagram' | 'meta';
  platform: 'instagram' | 'facebook' | 'x';
  caption: string | null;
  image_url: string | null;
  shortlink: string | null;
  scheduled_at: string | null;
  status: 'queued' | 'claimed' | 'error' | 'done' | 'canceled';
};

const STATUS = [
  { key: 'all', label: 'Todos' },
  { key: 'queued', label: 'Agendados' },
  { key: 'claimed', label: 'Em execução' },
  { key: 'done', label: 'Concluídos' },
  { key: 'error', label: 'Com erro' },
  { key: 'canceled', label: 'Cancelados' },
] as const;

const PAGE_SIZE = 10;

function fmt(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function StatusPill({ s }: { s: SchedItem['status'] }) {
  const map: Record<SchedItem['status'], string> = {
    queued:   'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    claimed:  'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    done:     'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    error:    'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    canceled: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold ${map[s]}`}>
      {s}
    </span>
  );
}

export default function ShopeeSchedulesPage() {
  const [status, setStatus] = React.useState<(typeof STATUS)[number]['key']>('all');
  const [loading, setLoading] = React.useState(true);
  const [spin, setSpin] = React.useState(false);
  const [items, setItems] = React.useState<SchedItem[]>([]);
  const [page, setPage] = React.useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const vis = React.useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  async function load() {
    setLoading(true);
    try {
      const qs = status !== 'all' ? `?status=${status}` : '';
      const res = await fetch(`/api/schedules${qs}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Falha ao carregar');
      setItems(json.items ?? []);
      setPage(1);
    } catch (e) {
      console.error(e);
      alert('Não foi possível carregar os agendamentos.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setSpin(true);
    await load();
    setSpin(false);
  }

  async function cancel(id: string) {
    if (!confirm('Cancelar este agendamento?')) return;
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Falha ao cancelar');
      setItems((arr) => arr.filter((x) => x.id !== id));
    } catch (e) {
      console.error(e);
      alert('Não foi possível cancelar. Tente novamente.');
    }
  }

  React.useEffect(() => { load(); }, [status]);

  return (
    <main className="relative p-6 space-y-6 max-w-6xl mx-auto">
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-x-0 -top-8 h-28 -z-10"
        style={{ background: 'radial-gradient(80% 120% at 0% 0%, #FFF4F0 0%, transparent 70%)' }}
      />

      <SectionHeader
        emoji="🗓️"
        title="Agendamentos"
        subtitle="Gerencie as publicações programadas desta conta."
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/shopee"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao painel
        </Link>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Status:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="border rounded-md text-sm px-2 py-1.5 bg-white"
          >
            {STATUS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm"
          >
            {spin ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Atualizar
          </button>
        </div>
      </div>

      {/* Card + Table */}
      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="text-left text-gray-600">
                <th className="py-3 pl-5 pr-2 w-48">Quando</th>
                <th className="px-2 w-40">Plataforma</th>
                <th className="px-2">Legenda</th>
                <th className="px-2 w-[420px]">Link</th>
                <th className="px-2 w-32">Status</th>
                <th className="py-3 pl-2 pr-5 w-32 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-gray-500">
                    <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                    Carregando…
                  </td>
                </tr>
              ) : vis.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-gray-500">
                    Nenhum agendamento encontrado.
                  </td>
                </tr>
              ) : (
                vis.map((it, i) => (
                  <tr key={it.id} className={i !== 0 ? 'border-t border-gray-100' : ''}>
                    <td className="py-3 pl-5 pr-2 align-top whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{fmt(it.scheduled_at)}</span>
                      </div>
                    </td>

                    <td className="px-2 align-top whitespace-nowrap">
                      <div className="text-[10px] tracking-wide uppercase text-gray-500 font-semibold">
                        {it.provider}
                      </div>
                      <div className="text-sm font-medium">{it.platform}</div>
                    </td>

                    <td className="px-2 align-top">
                      <div className="text-gray-800 leading-snug line-clamp-2">
                        {it.caption || '—'}
                      </div>
                    </td>

                    <td className="px-2 align-top">
                      {it.shortlink ? (
                        <a
                          href={it.shortlink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline block truncate"
                          title={it.shortlink}
                        >
                          {it.shortlink}
                        </a>
                      ) : '—'}
                    </td>

                    <td className="px-2 align-top whitespace-nowrap">
                      <StatusPill s={it.status} />
                    </td>

                    <td className="py-3 pl-2 pr-5 align-top">
                      <div className="flex justify-end">
                        {(it.status === 'queued' || it.status === 'claimed') ? (
                          <button
                            onClick={() => cancel(it.id)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm"
                          >
                            <XCircle className="w-4 h-4" />
                            Cancelar
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && items.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-white text-sm">
            <div className="text-gray-600">
              Página {page} de {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-full border hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-full border hover:bg-gray-50 disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
