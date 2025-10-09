// app/dashboard/shopee/schedules/page.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarClock, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { SectionHeader } from '@/components/ui';

type ScheduleItem = {
  id: string;
  provider: 'meta' | 'instagram';
  platform: 'facebook' | 'instagram' | 'x';
  caption: string;
  image_url?: string | null;
  shortlink?: string | null;
  scheduled_at: string | null; // ISO
  status: 'queued' | 'claimed' | 'error' | 'done' | 'canceled';
};

type StatusFilter = 'all' | ScheduleItem['status'];

function fmtWhen(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const dd = d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const hh = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${dd}, ${hh}`;
}

export default function ShopeeSchedulesPage() {
  const [items, setItems] = React.useState<ScheduleItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<StatusFilter>('all');

  async function load() {
    setLoading(true);
    try {
      const q = status === 'all' ? '' : `?status=${encodeURIComponent(status)}`;
      const res = await fetch(`/api/schedules${q}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Falha ao carregar');
      setItems(data.items ?? []);
    } catch (e) {
      console.error(e);
      alert('Não foi possível carregar os agendamentos.');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function cancel(id: string) {
    const ok = confirm('Cancelar este agendamento?');
    if (!ok) return;
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Falha ao cancelar');
      setItems((old) => old.map((it) => (it.id === id ? { ...it, status: 'canceled' } : it)));
    } catch (e) {
      console.error(e);
      alert('Não foi possível cancelar. Tente novamente.');
    }
  }

  const canCancel = (s: ScheduleItem['status']) => s === 'queued' || s === 'claimed';

  return (
    <main className="relative max-w-6xl mx-auto px-4 pb-16">
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-x-0 -top-8 h-28 -z-10"
        style={{ background: 'radial-gradient(80% 120% at 0% 0%, #FFF4F0 0%, transparent 70%)' }}
      />

      <SectionHeader emoji="🗓️" title="Agendamentos" subtitle="Gerencie as publicações programadas desta conta." />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          href="/app/dashboard/shopee"
          className="inline-flex items-center gap-2 rounded-xl border border-[#FFD9CF] bg-white px-3 py-2 text-sm hover:bg-[#FFF4F0]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao painel
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-gray-600">Status:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="rounded-lg border border-[#FFD9CF] bg-white px-2.5 py-1.5 text-sm"
          >
            <option value="all">Todos</option>
            <option value="queued">queued</option>
            <option value="claimed">claimed</option>
            <option value="done">done</option>
            <option value="canceled">canceled</option>
            <option value="error">error</option>
          </select>

          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#FFD9CF] bg-white px-3 py-2 text-sm hover:bg-[#FFF4F0] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Atualizar
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-[#FFD9CF] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full table-fixed">
            <colgroup>
              <col className="w-56" />      {/* Quando */}
              <col className="w-40" />      {/* Plataforma */}
              <col className="w-[560px]" />  {/* Link (largo) */}
              <col className="w-32" />      {/* Status */}
              <col className="w-40" />      {/* Ações */}
            </colgroup>

            <thead className="text-left text-sm text-gray-600">
              <tr className="[&>th]:px-4 [&>th]:py-3 border-b">
                <th>Quando</th>
                <th>Plataforma</th>
                <th>Link</th>
                <th>Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {items.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                    Nenhum agendamento encontrado.
                  </td>
                </tr>
              )}

              {items.map((it, i) => (
                <tr key={it.id} className={`align-top border-b last:border-none ${i % 2 ? 'bg-[#FFF8F6]' : ''}`}>
                  {/* Quando */}
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <CalendarClock className="mt-0.5 h-4 w-4 text-gray-500" />
                      <div className="leading-tight">
                        <div className="font-medium">{fmtWhen(it.scheduled_at)}</div>
                        <div className="text-xs text-gray-500">
                          {it.scheduled_at ? new Date(it.scheduled_at).toLocaleString() : '—'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Plataforma */}
                  <td className="px-4 py-3">
                    <div className="text-[11px] tracking-wide text-gray-500 uppercase">{it.provider}</div>
                    <div className="text-sm">{it.platform}</div>
                  </td>

                  {/* Link */}
                  <td className="px-4 py-3">
                    {it.shortlink ? (
                      <a
                        href={it.shortlink}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-blue-700 hover:underline"
                      >
                        {it.shortlink}
                      </a>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={[
                        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                        it.status === 'queued'
                          ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                          : it.status === 'claimed'
                          ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                          : it.status === 'done'
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                          : it.status === 'canceled'
                          ? 'bg-gray-100 text-gray-600 ring-1 ring-gray-200'
                          : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
                      ].join(' ')}
                    >
                      {it.status}
                    </span>
                  </td>

                  {/* Ações */}
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => cancel(it.id)}
                        disabled={!canCancel(it.status)}
                        className="inline-flex min-w-[112px] items-center justify-center gap-2 rounded-xl border border-[#FFD9CF] bg-white px-3 py-2 text-sm hover:bg-[#FFF4F0] disabled:opacity-50"
                        title={canCancel(it.status) ? 'Cancelar agendamento' : 'Não é possível cancelar'}
                      >
                        <XCircle className="h-4 w-4" />
                        Cancelar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <div className="inline-flex items-center gap-2 text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando…
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
