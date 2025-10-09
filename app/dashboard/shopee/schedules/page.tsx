// app/dashboard/shopee/schedules/page.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { SectionHeader } from '@/components/ui';
import { ArrowLeft, CalendarClock, RefreshCw, Loader2, AlertCircle } from 'lucide-react';

type Row = {
  id: string;
  provider: string;
  platform: string;
  caption?: string | null;
  image_url?: string | null;
  shortlink?: string | null;
  url_canonical?: string | null;
  scheduled_at: string | null;
  status: 'queued' | 'claimed' | 'error' | 'done' | 'canceled' | string;
};

type StatusFilter = 'all' | 'queued' | 'claimed' | 'error' | 'done' | 'canceled';

function fmtDateShort(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(+d)) return iso || '—';
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); // ex: 08/10/2025, 23:34
}

function shortText(s?: string | null, max = 36) {
  if (!s) return '—';
  const clean = s.replace(/^https?:\/\//, '');
  return clean.length > max ? clean.slice(0, max - 1) + '…' : clean;
}

function StatusPill({ s }: { s: Row['status'] }) {
  const map: Record<string, string> = {
    queued: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    claimed: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
    done: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    canceled: 'bg-zinc-50 text-zinc-600 ring-1 ring-zinc-200',
    error: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  };
  const cls = map[s] ?? 'bg-zinc-50 text-zinc-700 ring-1 ring-zinc-200';
  return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${cls}`}>{s}</span>;
}

export default function ShopeeSchedulesPage() {
  const [status, setStatus] = React.useState<StatusFilter>('all');
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [rowBusy, setRowBusy] = React.useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  async function fetchData(s: StatusFilter) {
    setLoading(true);
    setErrorMsg(null);
    try {
      const qs = s === 'all' ? '' : `?status=${encodeURIComponent(s)}`;
      const res = await fetch(`/api/schedules${qs}`, { cache: 'no-store' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      const j = (await res.json()) as { items: Row[] };
      setRows(j.items || []);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Falha ao carregar agendamentos.');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchData(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function cancelOne(id: string) {
    setRowBusy((m) => ({ ...m, [id]: true }));
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/schedules/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      setRows((arr) => arr.filter((r) => r.id !== id));
    } catch (e: any) {
      setErrorMsg(e?.message || 'Não foi possível cancelar.');
    } finally {
      setRowBusy((m) => ({ ...m, [id]: false }));
    }
  }

  // aceita "YYYY-MM-DD HH:mm" e "DD/MM/YYYY HH:mm" -> ISO
  function parseClientInputToIso(s: string) {
    s = (s || '').trim();
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
    if (m) {
      const [, Y, M, D, h, min] = m;
      const d = new Date(+Y, +M - 1, +D, +h, +min);
      return isNaN(+d) ? null : d.toISOString();
    }
    m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})[ ,T](\d{2}):(\d{2})$/);
    if (m) {
      const [, D, M, Y, h, min] = m;
      const d = new Date(+Y, +M - 1, +D, +h, +min);
      return isNaN(+d) ? null : d.toISOString();
    }
    const d = new Date(s);
    return isNaN(+d) ? null : d.toISOString();
  }

  async function rescheduleOne(id: string, currentIso?: string | null) {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const d0 = currentIso ? new Date(currentIso) : now;
    const suggestion = `${pad(d0.getDate())}/${pad(d0.getMonth() + 1)}/${d0.getFullYear()} ${pad(
      d0.getHours()
    )}:${pad(d0.getMinutes())}`;

    const answer = window.prompt(
      'Nova data/hora (aceita: DD/MM/YYYY HH:mm ou YYYY-MM-DD HH:mm):',
      suggestion
    );
    if (!answer) return;

    const iso = parseClientInputToIso(answer);
    if (!iso) {
      setErrorMsg('Formato inválido. Use DD/MM/YYYY HH:mm ou YYYY-MM-DD HH:mm.');
      return;
    }

    setRowBusy((m) => ({ ...m, [id]: true }));
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/schedules/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // ✅ o backend espera `scheduled_at`
        body: JSON.stringify({ scheduled_at: iso }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      setRows((arr) =>
        arr.map((r) =>
          r.id === id ? { ...r, scheduled_at: j.scheduled_at ?? iso, status: j.status ?? r.status } : r
        )
      );
    } catch (e: any) {
      setErrorMsg(e?.message || 'Não foi possível reagendar.');
    } finally {
      setRowBusy((m) => ({ ...m, [id]: false }));
    }
  }

  return (
    <div className="relative max-w-6xl mx-auto px-4 pb-16">
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-x-0 -top-8 h-28 -z-10"
        style={{ background: 'radial-gradient(80% 120% at 0% 0%, #FFF4F0 0%, transparent 70%)' }}
      />
      <SectionHeader emoji="🗓️" title="Agendamentos" subtitle="Gerencie as publicações programadas desta conta." />

      <div className="mt-4">
        <Link
          href="/dashboard/shopee"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300/60 px-3 py-1.5 text-sm hover:bg-zinc-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao painel
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-zinc-600">Status:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm"
          >
            <option value="all">Todos</option>
            <option value="queued">queued</option>
            <option value="claimed">claimed</option>
            <option value="done">done</option>
            <option value="canceled">canceled</option>
            <option value="error">error</option>
          </select>

          <button
            onClick={() => fetchData(status)}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Tabela (md+) */}
      <div className="mt-4 hidden md:block">
        <div className="overflow-x-auto">
          <div className="min-w-[980px] rounded-2xl border border-zinc-200 overflow-hidden bg-white">
            <div className="grid grid-cols-[220px_160px_1fr_120px_120px] items-center bg-zinc-50/60 px-4 py-3 text-xs font-medium text-zinc-600">
              <div>Quando</div>
              <div>Plataforma</div>
              <div>Legenda &amp; Link</div>
              <div>Status</div>
              <div className="text-right pr-1">Ações</div>
            </div>

            {loading ? (
              <div className="px-6 py-10 flex items-center gap-3 text-zinc-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando...
              </div>
            ) : rows.length === 0 ? (
              <div className="px-6 py-10 text-zinc-600">Nenhum agendamento.</div>
            ) : (
              rows.map((r) => (
                <div
                  key={r.id}
                  className="grid grid-cols-[220px_160px_1fr_120px_120px] items-start px-4 py-3 border-t border-zinc-200/70"
                >
                  <div className="flex items-start gap-2 text-sm">
                    <CalendarClock className="mt-0.5 w-4 h-4 text-zinc-500" />
                    <div className="leading-5 font-medium text-zinc-800">{fmtDateShort(r.scheduled_at)}</div>
                  </div>

                  <div className="text-sm text-zinc-800">
                    <div className="uppercase text-[10px] tracking-wide text-zinc-500">{r.provider || '-'}</div>
                    <div className="mt-0.5">{r.platform || '-'}</div>
                  </div>

                  <div className="text-sm pr-4">
                    {r.caption ? (
                      <div className="text-zinc-800 break-words">
                        <div className="line-clamp-2">{r.caption}</div>
                      </div>
                    ) : (
                      <div className="text-zinc-500">Sem legenda</div>
                    )}
                    <div className="mt-1">
                      {r.shortlink ? (
                        <a
                          href={r.shortlink}
                          target="_blank"
                          rel="noreferrer"
                          title={r.shortlink}
                          className="text-zinc-700 underline underline-offset-2 truncate block max-w-full"
                        >
                          {shortText(r.shortlink)}
                        </a>
                      ) : r.url_canonical ? (
                        <a
                          href={r.url_canonical}
                          target="_blank"
                          rel="noreferrer"
                          title={r.url_canonical}
                          className="text-zinc-700 underline underline-offset-2 truncate block max-w-full"
                        >
                          {shortText(r.url_canonical)}
                        </a>
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm">
                    <StatusPill s={r.status} />
                  </div>

                  <div className="flex flex-col items-stretch gap-2 pr-1">
                    <button
                      onClick={() => rescheduleOne(r.id, r.scheduled_at)}
                      disabled={rowBusy[r.id]}
                      className="inline-flex justify-center items-center gap-2 rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-zinc-50"
                    >
                      {rowBusy[r.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Reagendar
                    </button>
                    <button
                      onClick={() => cancelOne(r.id)}
                      disabled={rowBusy[r.id] || r.status === 'canceled' || r.status === 'done'}
                      className="inline-flex justify-center items-center gap-2 rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-zinc-50"
                    >
                      {rowBusy[r.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="w-4 h-4">✕</span>}
                      Cancelar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Cards (mobile) */}
      <div className="mt-4 md:hidden space-y-3">
        {loading ? (
          <div className="px-2 py-6 flex items-center gap-3 text-zinc-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando...
          </div>
        ) : rows.length === 0 ? (
          <div className="px-2 py-6 text-zinc-600">Nenhum agendamento.</div>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="rounded-xl border border-zinc-200 bg-white p-3 space-y-2">
              <div className="flex items-start gap-2">
                <CalendarClock className="mt-0.5 w-4 h-4 text-zinc-500" />
                <div className="font-medium text-zinc-800">{fmtDateShort(r.scheduled_at)}</div>
              </div>
              <div className="text-xs text-zinc-600">
                {r.provider?.toUpperCase() || '-'} · {r.platform || '-'}
              </div>
              <div className="text-sm">
                {r.caption ? (
                  <div className="text-zinc-800 break-words">
                    <div className="line-clamp-3">{r.caption}</div>
                  </div>
                ) : (
                  <div className="text-zinc-500">Sem legenda</div>
                )}
                <div className="mt-1">
                  {r.shortlink ? (
                    <a
                      href={r.shortlink}
                      target="_blank"
                      rel="noreferrer"
                      title={r.shortlink}
                      className="text-zinc-700 underline underline-offset-2 truncate block"
                    >
                      {shortText(r.shortlink)}
                    </a>
                  ) : r.url_canonical ? (
                    <a
                      href={r.url_canonical}
                      target="_blank"
                      rel="noreferrer"
                      title={r.url_canonical}
                      className="text-zinc-700 underline underline-offset-2 truncate block"
                    >
                      {shortText(r.url_canonical)}
                    </a>
                  ) : (
                    <span className="text-zinc-500">—</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => rescheduleOne(r.id, r.scheduled_at)}
                  disabled={rowBusy[r.id]}
                  className="flex-1 inline-flex justify-center items-center gap-2 rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-zinc-50"
                >
                  {rowBusy[r.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Reagendar
                </button>
                <button
                  onClick={() => cancelOne(r.id)}
                  disabled={rowBusy[r.id] || r.status === 'canceled' || r.status === 'done'}
                  className="flex-1 inline-flex justify-center items-center gap-2 rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-zinc-50"
                >
                  {rowBusy[r.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="w-4 h-4">✕</span>}
                  Cancelar
                </button>
              </div>
              <div className="text-xs">
                <StatusPill s={r.status} />
              </div>
            </div>
          ))
        )}
      </div>

      {errorMsg && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}
    </div>
  );
}
