'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { SectionHeader } from '@/components/ui';
import {
  ArrowLeft,
  RefreshCw,
  CalendarClock,
  Clock,
  Loader2,
  XCircle,
} from 'lucide-react';

type SchedItem = {
  id: string;
  provider: 'instagram' | 'meta';
  platform: 'instagram' | 'facebook' | 'x';
  caption: string | null;
  image_url: string | null;
  shortlink: string | null;
  scheduled_at: string | null; // ISO
  status: 'queued' | 'claimed' | 'error' | 'done' | 'canceled';
};

const STATUS_OPTIONS = [
  { key: 'all', label: 'Todos' },
  { key: 'queued', label: 'Agendados' },
  { key: 'claimed', label: 'Em execução' },
  { key: 'done', label: 'Concluídos' },
  { key: 'error', label: 'Com erro' },
  { key: 'canceled', label: 'Cancelados' },
] as const;

const PAGE_SIZE = 10;

function formatWhen(iso?: string | null) {
  if (!iso) return '—';
  // usa fuso local do navegador
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusPill({ s }: { s: SchedItem['status'] }) {
  const styles: Record<SchedItem['status'], string> = {
    queued:
      'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    claimed:
      'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    done:
      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    error:
      'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    canceled:
      'bg-slate-50 text-slate-600 ring-1 ring-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[s]}`}>
      {s}
    </span>
  );
}

export default function ShopeeSchedulesPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const initialStatus = (sp.get('status') ?? 'all') as (typeof STATUS_OPTIONS)[number]['key'];

  const [status, setStatus] = React.useState<typeof initialStatus>(initialStatus);
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<SchedItem[]>([]);
  const [page, setPage] = React.useState(1);
  const [refreshSpin, setRefreshSpin] = React.useState(false);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = React.useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (status && status !== 'all') qs.set('status', status);
      const res = await fetch(`/api/schedules${qs.toString() ? `?${qs}` : ''}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Falha ao carregar');
      setItems(data.items ?? []);
      setPage(1);
    } catch (e) {
      console.error(e);
      alert('Não foi possível carregar os agendamentos.');
    } finally {
      setLoading(false);
    }
  }

  async function onCancel(id: string) {
    if (!confirm('Cancelar este agendamento?')) return;
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Falha ao cancelar');
      // remove localmente
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      console.error(e);
      alert('Não foi possível cancelar. Tente novamente.');
    }
  }

  React.useEffect(() => {
    // sincronia com URL (opcional)
    const url = new URL(window.location.href);
    if (status) url.searchParams.set('status', status);
    if (status === 'all') url.searchParams.delete('status');
    window.history.replaceState(null, '', url.toString());

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <main className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* fundo suave como no resto do app */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-x-0 -top-8 h-28 -z-10"
        style={{
          background:
            'radial-gradient(80% 120% at 0% 0%, #FFF4F0 0%, transparent 70%)',
        }}
      />

      <SectionHeader
        emoji="🗓️"
        title="Agendamentos"
        subtitle="Gerencie as publicações programadas desta conta."
      />

      {/* Ações do topo */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/shopee"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 text-sm hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao painel
        </Link>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Status:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="border rounded-md text-sm px-2 py-1.5"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={async () => {
              setRefreshSpin(true);
              await load();
              setRefreshSpin(false);
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 text-sm hover:bg-gray-50"
          >
            {refreshSpin ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Atualizar
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="rounded-2xl border bg-white/80 backdrop-blur">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-3 pl-4 pr-2 w-[190px]">Quando</th>
                <th className="px-2 w-[140px]">Plataforma</th>
                <th className="px-2">Legenda</th>
                <th className="px-2 w-[360px]">Link</th>
                <th className="px-2 w-[130px]">Status</th>
                <th className="py-3 pl-2 pr-4 w-[120px] text-right">Ações</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                    Carregando…
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    Nenhum agendamento encontrado.
                  </td>
                </tr>
              ) : (
                pageItems.map((it) => (
                  <tr key={it.id} className="border-t align-top">
                    <td className="py-3 pl-4 pr-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{formatWhen(it.scheduled_at)}</span>
                      </div>
                    </td>

                    <td className="px-2 whitespace-nowrap">
                      <div className="text-[11px] uppercase tracking-wide text-gray-500">
                        {it.provider}
                      </div>
                      <div className="font-medium">{it.platform}</div>
                    </td>

                    <td className="px-2">
                      <div className="line-clamp-2 leading-snug text-gray-800">
                        {it.caption || '—'}
                      </div>
                    </td>

                    <td className="px-2">
                      {it.shortlink ? (
                        <a
                          href={it.shortlink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-words"
                        >
                          {it.shortlink}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="px-2 whitespace-nowrap">
                      <StatusPill s={it.status} />
                    </td>

                    <td className="py-3 pl-2 pr-4">
                      <div className="flex justify-end">
                        {(it.status === 'queued' || it.status === 'claimed') ? (
                          <button
                            onClick={() => onCancel(it.id)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
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

        {/* Paginação */}
        {!loading && items.length > PAGE_SIZE && (
          <div className="flex items-center justify-between p-3 border-t text-sm">
            <div className="text-gray-600">
              Página {page} de {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-md border disabled:opacity-50 hover:bg-gray-50"
              >
                Anterior
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-md border disabled:opacity-50 hover:bg-gray-50"
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
