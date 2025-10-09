"use client";

import * as React from "react";
import Link from "next/link";
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
  shortlink?: string | null;       // link com UTM (href)
  url_canonical?: string | null;   // link curto p/ mostrar
  scheduled_at: string | null;
  status: "queued" | "claimed" | "error" | "done" | "canceled" | string;
};

type StatusFilter = "all" | "queued" | "claimed" | "error" | "done" | "canceled";

/* ---------- helpers ---------- */
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

function shortenForDisplay(u?: string | null) {
  if (!u) return "—";
  try {
    const url = new URL(u);
    const host = url.host;
    const segs = url.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
    const last = segs[segs.length - 1] || "";
    return last ? `${host}/${last}` : host;
  } catch {
    const noProto = u.replace(/^https?:\/\//, "");
    const [noHash] = noProto.split("#");
    const [base] = noHash.split("?");
    const parts = base.split("/").filter(Boolean);
    if (parts.length >= 2) return `${parts[0]}/${parts[parts.length - 1]}`;
    return parts[0] || base;
  }
}

function isoToLocalInputValue(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

function localInputToIsoUtc(localStr: string) {
  // new Date('YYYY-MM-DDTHH:mm') interpreta no fuso local
  const d = new Date(localStr);
  return isNaN(d.getTime()) ? null : d.toISOString();
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

/* ---------- page ---------- */
export default function ShopeeSchedulesPage() {
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // busy flags
  const [busyCancel, setBusyCancel] = React.useState<Record<string, boolean>>(
    {}
  );
  const [busyResched, setBusyResched] = React.useState<Record<string, boolean>>(
    {}
  );

  // reschedule inline editor
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editLocal, setEditLocal] = React.useState<string>("");

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
    setBusyCancel((m) => ({ ...m, [id]: true }));
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
      setBusyCancel((m) => ({ ...m, [id]: false }));
    }
  }

  function openResched(r: Row) {
    setEditingId(r.id);
    setEditLocal(isoToLocalInputValue(r.scheduled_at));
  }

  function closeResched() {
    setEditingId(null);
    setEditLocal("");
  }

  async function saveResched(id: string) {
    if (!editLocal) return;
    const iso = localInputToIsoUtc(editLocal);
    if (!iso) {
      setErrorMsg("Datetime inválido.");
      return;
    }
    setBusyResched((m) => ({ ...m, [id]: true }));
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/schedules/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduled_at: iso }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      // atualiza linha localmente
      setRows((arr) =>
        arr.map((r) =>
          r.id === id ? { ...r, scheduled_at: iso, status: "queued" } : r
        )
      );
      closeResched();
    } catch (e: any) {
      setErrorMsg(e?.message || "Não foi possível reagendar.");
    } finally {
      setBusyResched((m) => ({ ...m, [id]: false }));
    }
  }

  const minLocal = isoToLocalInputValue(new Date().toISOString());

  return (
    <div className="relative max-w-6xl mx-auto px-4 pb-16">
      {/* topo compacto: só botões/controles */}
      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/dashboard/shopee"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300/60 px-3 py-1.5 text-sm hover:bg-zinc-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao painel
        </Link>

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
        <div className="min-w-[1200px] rounded-2xl border border-zinc-200 overflow-hidden bg-white">
          {/* header */}
          <div className="grid grid-cols-[220px_150px_minmax(320px,1fr)_minmax(280px,1fr)_120px_190px] gap-x-4 items-center bg-zinc-50/60 px-4 py-3 text-xs font-medium text-zinc-600">
            <div>Quando</div>
            <div>Plataforma</div>
            <div>Legenda</div>
            <div>Link</div>
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
              const href = r.shortlink || r.url_canonical || "#";
              const display = shortenForDisplay(r.url_canonical || r.shortlink);

              const isEditing = editingId === r.id;

              return (
                <div
                  key={r.id}
                  className="grid grid-cols-[220px_150px_minmax(320px,1fr)_minmax(280px,1fr)_120px_190px] gap-x-4 items-start px-4 py-3 border-t border-zinc-200/70"
                >
                  {/* quando – só linha amigável */}
                  <div className="flex items-start gap-2 text-sm">
                    <CalendarClock className="mt-0.5 w-4 h-4 text-zinc-500" />
                    <div className="leading-5 font-medium text-zinc-800">
                      {fmtWhen(r.scheduled_at)}
                    </div>
                  </div>

                  {/* plataforma */}
                  <div className="text-sm text-zinc-800">
                    <div className="uppercase text-[10px] tracking-wide text-zinc-500">
                      {r.provider || "-"}
                    </div>
                    <div className="mt-0.5">{r.platform || "-"}</div>
                  </div>

                  {/* legenda – até 2 linhas */}
                  <div className="min-w-0">
                    {r.caption ? (
                      <div
                        title={r.caption || undefined}
                        className="text-sm text-zinc-800 line-clamp-2"
                      >
                        {r.caption}
                      </div>
                    ) : (
                      <span className="text-sm text-zinc-500">—</span>
                    )}
                  </div>

                  {/* link curto – até 2 linhas */}
                  <div className="min-w-0">
                    {href && href !== "#" ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        title={href}
                        className="text-sm text-zinc-800 underline underline-offset-2 block break-words whitespace-normal line-clamp-2"
                      >
                        {display}
                      </a>
                    ) : (
                      <span className="text-sm text-zinc-500">—</span>
                    )}
                  </div>

                  {/* status */}
                  <div className="text-sm">
                    <StatusPill s={r.status} />
                  </div>

                  {/* ações */}
                  <div className="flex justify-end pr-1">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="datetime-local"
                          className="border border-zinc-300 rounded-md px-2 py-1 text-sm"
                          min={minLocal}
                          value={editLocal}
                          onChange={(e) => setEditLocal(e.target.value)}
                        />
                        <button
                          onClick={() => saveResched(r.id)}
                          disabled={busyResched[r.id]}
                          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-zinc-50"
                        >
                          {busyResched[r.id] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : null}
                          Salvar
                        </button>
                        <button
                          onClick={closeResched}
                          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-zinc-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openResched(r)}
                          disabled={r.status === "done"}
                          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-zinc-50"
                        >
                          Reagendar
                        </button>
                        <button
                          onClick={() => cancelOne(r.id)}
                          disabled={
                            busyCancel[r.id] ||
                            r.status === "canceled" ||
                            r.status === "done"
                          }
                          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-zinc-50"
                        >
                          {busyCancel[r.id] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <span className="w-4 h-4 inline-block">✕</span>
                          )}
                          Cancelar
                        </button>
                      </div>
                    )}
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
