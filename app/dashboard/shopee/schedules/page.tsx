// app/dashboard/shopee/schedules/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { SectionHeader } from "@/components/ui";
import {
  ArrowLeft,
  CalendarClock,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";

type Row = {
  id: string;
  provider: string;
  platform: string;
  caption?: string | null;
  image_url?: string | null;
  shortlink?: string | null;       // com UTM (href usa este)
  url_canonical?: string | null;   // curto sem UTM (quando existir)
  scheduled_at: string | null;
  status: "queued" | "claimed" | "error" | "done" | "canceled" | string;
};

type StatusFilter = "all" | "queued" | "claimed" | "error" | "done" | "canceled";

function fmtWhen(iso: string | null) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${date}, ${time}`;
  } catch {
    return iso;
  }
}

// Retorna um texto curto e estável para mostrar (sem query/hash)
function shortenForDisplay(u?: string | null) {
  if (!u) return "—";
  try {
    const url = new URL(u);
    const host = url.host;
    const path = url.pathname.replace(/\/+$/, "");
    const seg = path.split("/").filter(Boolean);
    const last = seg[seg.length - 1] || "";
    // Para shortlinks (ex.: s.shopee.com.br/4LAbOlg1kB) mostramos host/slug
    if (last) return `${host}/${last}`;
    return host;
  } catch {
    // fallback: remove proto + query/hash
    const noProto = u.replace(/^https?:\/\//, "");
    const [noHash] = noProto.split("#");
    const [base] = noHash.split("?");
    const parts = base.split("/").filter(Boolean);
    if (parts.length >= 2) return `${parts[0]}/${parts[parts.length - 1]}`;
    return parts[0] || base;
  }
}

function StatusPill({ s }: { s: Row["status"] }) {
  const map: Record<string, string> = {
    queued: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    claimed: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    done: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    canceled: "bg-zinc-50 text-zinc-600 ring-1 ring-zinc-200",
    error: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  };
  const cls = map[s] ?? "bg-zinc-50 text-zinc-700 ring-1 ring-zinc-200";
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${cls}`}>
      {s}
    </span>
  );
}

export default function ShopeeSchedulesPage() {
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [rowBusy, setRowBusy] = React.useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  async function fetchData(s: StatusFilter) {
    setLoading(true);
    setErrorMsg(null);
    try {
      const qs = s === "all" ? "" : `?status=${encodeURIComponent(s)}`;
      const res = await fetch(`/api/schedules${qs}`, { cache: "no-store" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      const j = (await res.json()) as { items: Row[] };
      setRows(j.items || []);
    } catch (e: any) {
      setErrorMsg(e?.message || "Falha ao carregar agendamentos.");
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
      const res = await fetch(`/api/schedules/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      setRows((arr) => arr.filter((r) => r.id !== id));
    } catch (e: any) {
      setErrorMsg(e?.message || "Não foi possível cancelar.");
    } finally {
      setRowBusy((m) => ({ ...m, [id]: false }));
    }
  }

  return (
    <div className="relative max-w-6xl mx-auto px-4 pb-16">
      {/* halo topo */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-x-0 -top-8 h-28 -z-10"
        style={{
          background:
            "radial-gradient(80% 120% at 0% 0%, #FFF4F0 0%, transparent 70%)",
        }}
      />

      <SectionHeader
        emoji="🗓️"
        title="Agendamentos"
        subtitle="Gerencie as publicações programadas desta conta."
      />

      {/* voltar */}
      <div className="mt-4">
        <Link
          href="/dashboard/shopee"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300/60 px-3 py-1.5 text-sm hover:bg-zinc-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao painel
        </Link>
      </div>

      {/* filtros / refresh */}
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

      {/* tabela */}
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[1000px] rounded-2xl border border-zinc-200 overflow-hidden bg-white">
          {/* header */}
          <div className="grid grid-cols-[220px_160px_minmax(320px,1fr)_140px_150px] items-center bg-zinc-50/60 px-4 py-3 text-xs font-medium text-zinc-600">
            <div>Quando</div>
            <div>Plataforma</div>
            <div>Link (curto) / Legenda</div>
            <div>Status</div>
            <div className="text-right pr-1">Ações</div>
          </div>

          {/* body */}
          {loading ? (
            <div className="px-6 py-10 flex items-center gap-3 text-zinc-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando...
            </div>
          ) : rows.length === 0 ? (
            <div className="px-6 py-10 text-zinc-600">Nenhum agendamento.</div>
          ) : (
            rows.map((r) => {
              const display = shortenForDisplay(r.url_canonical || r.shortlink);
              const href = r.shortlink || r.url_canonical || "#";
              return (
                <div
                  key={r.id}
                  className="grid grid-cols-[220px_160px_minmax(320px,1fr)_140px_150px] items-center px-4 py-3 border-t border-zinc-200/70"
                >
                  {/* quando */}
                  <div className="flex items-start gap-2 text-sm">
                    <CalendarClock className="mt-0.5 w-4 h-4 text-zinc-500" />
                    <div className="leading-5">
                      <div className="font-medium text-zinc-800">
                        {fmtWhen(r.scheduled_at)}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {r.scheduled_at || "—"}
                      </div>
                    </div>
                  </div>

                  {/* plataforma */}
                  <div className="text-sm text-zinc-800">
                    <div className="uppercase text-[10px] tracking-wide text-zinc-500">
                      {r.provider || "-"}
                    </div>
                    <div className="mt-0.5">{r.platform || "-"}</div>
                  </div>

                  {/* link curto + legenda (2 linhas máx) */}
                  <div className="min-w-0 text-sm">
                    {href && href !== "#" ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        title={href}
                        className="text-zinc-800 underline underline-offset-2 block overflow-hidden text-ellipsis whitespace-nowrap"
                      >
                        {display}
                      </a>
                    ) : (
                      <span className="text-zinc-500">—</span>
                    )}

                    {r.caption ? (
                      <div
                        title={r.caption || undefined}
                        className="text-xs text-zinc-500 mt-0.5 line-clamp-2"
                      >
                        {r.caption}
                      </div>
                    ) : null}
                  </div>

                  {/* status */}
                  <div className="text-sm">
                    <StatusPill s={r.status} />
                  </div>

                  {/* ações */}
                  <div className="flex justify-end pr-1 whitespace-nowrap">
                    <button
                      onClick={() => cancelOne(r.id)}
                      disabled={
                        rowBusy[r.id] ||
                        r.status === "canceled" ||
                        r.status === "done"
                      }
                      className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-zinc-50"
                    >
                      {rowBusy[r.id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span className="w-4 h-4 inline-block">✕</span>
                      )}
                      Cancelar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* erro */}
      {errorMsg && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}
    </div>
  );
}
