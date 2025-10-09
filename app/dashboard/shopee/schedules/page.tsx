// app/dashboard/shopee/schedules/page.tsx
'use client';

import * as React from 'react';

type ScheduleRow = {
  id: string;
  provider: 'instagram' | 'meta' | string;
  platform: 'instagram' | 'facebook' | 'x' | string;
  caption: string | null;
  image_url: string | null;
  shortlink: string | null;
  scheduled_at: string | null; // ISO
  status: 'queued' | 'claimed' | 'done' | 'error' | 'canceled' | string;
};

const STATUS_TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'queued', label: 'Na fila' },
  { key: 'claimed', label: 'Em processamento' },
  { key: 'done', label: 'Concluídos' },
  { key: 'error', label: 'Com erro' },
  { key: 'canceled', label: 'Cancelados' },
] as const;

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(' ');
}

function formatLocal(dtIso: string | null) {
  if (!dtIso) return '—';
  try {
    const d = new Date(dtIso);
    return (
      d.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }) +
      ' ' +
      d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    );
  } catch {
    return dtIso;
  }
}

function Badge({ status }: { status: ScheduleRow['status'] }) {
  const map: Record<string, string> = {
    queued: 'bg-amber-100 text-amber-800 border-amber-200',
    claimed: 'bg-blue-100 text-blue-800 border-blue-200',
    done: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    error: 'bg-rose-100 text-rose-800 border-rose-200',
    canceled: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  const cls = map[status] ?? 'bg-gray-100 text-gray-800 border-gray-200';
  const label =
    status === 'queued'
      ? 'Na fila'
      : status === 'claimed'
      ? 'Em processamento'
      : status === 'done'
      ? 'Concluído'
      : status === 'error'
      ? 'Erro'
      : status === 'canceled'
      ? 'Cancelado'
      : status;
  return <span className={cx('px-2 py-0.5 rounded border text-xs font-medium', cls)}>{label}</span>;
}

export default function SchedulesPage() {
  const [status, setStatus] = React.useState<(typeof STATUS_TABS)[number]['key']>('queued');
  const [items, setItems] = React.useState<ScheduleRow[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const cancelable = (s: ScheduleRow['status']) => s === 'queued' || s === 'claimed';

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (status && status !== 'all') qs.set('status', status);
      const res = await fetch(`/api/schedules?${qs.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Falha ao carregar');
      setItems(data.items || []);
    } catch (e: any) {
      setError(e?.message || 'Erro inesperado');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function onCancel(id: string) {
    const ok = window.confirm('Cancelar este agendamento?');
    if (!ok) return;
    try {
      // Otimista
      setItems((prev) => (prev ? prev.map((it) => (it.id === id ? { ...it, status: 'canceled' } : it)) : prev));
      const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Falha ao cancelar');
      }
    } catch (e: any) {
      alert(e?.message || 'Erro ao cancelar');
      // Recarrega para garantir consistência
      load();
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Agendamentos (Shopee)</h1>
          <p className="text-sm text-gray-500">Gerencie suas postagens programadas por usuário.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load()}
            className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm"
            disabled={loading}
          >
            {loading ? 'Atualizando…' : 'Atualizar'}
          </button>
        </div>
      </header>

      {/* Tabs de status */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatus(t.key)}
            className={cx(
              'px-3 py-1.5 rounded-lg border text-sm',
              status === t.key ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white border-gray-300 hover:bg-gray-50'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm">
            Carregando…
          </div>
        )}

        {!loading && items?.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
            Nenhum agendamento encontrado.
          </div>
        )}

        {items?.map((it) => (
          <div
            key={it.id}
            className="rounded-2xl border border-[#FFD9CF] bg-white/80 backdrop-blur p-3 md:p-4"
          >
            <div className="flex items-start gap-3">
              {it.image_url ? (
                <img
                  src={it.image_url}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover border"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg border grid place-items-center text-xs text-gray-500">
                  sem imagem
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge status={it.status} />
                  <span className="text-xs text-gray-500">
                    {it.platform === 'x' ? 'X (Twitter)' : it.platform} · {it.provider}
                  </span>
                </div>

                <div className="mt-1 text-sm font-medium line-clamp-2">
                  {it.caption || '—'}
                </div>

                <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-500">Agendado para:</span>{' '}
                    <span className="font-medium">{formatLocal(it.scheduled_at)}</span>
                  </div>
                  {it.shortlink && (
                    <a
                      href={it.shortlink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:no-underline"
                    >
                      link
                    </a>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                {cancelable(it.status) ? (
                  <button
                    onClick={() => onCancel(it.id)}
                    className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-800 hover:bg-rose-50 text-sm"
                  >
                    Cancelar
                  </button>
                ) : (
                  <span className="text-[11px] text-gray-500">Não cancelável</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <footer className="pt-2 text-xs text-gray-500">
        Dica: “Na fila” e “Em processamento” podem ser cancelados. Concluídos/Cancelados permanecem
        para histórico.
      </footer>
    </div>
  );
}
