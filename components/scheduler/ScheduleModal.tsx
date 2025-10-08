"use client";

import * as React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (isoDateTime: string) => void;
  /**
   * Pré-seleção opcional (UTC ISO).
   * Se não vier, sugere +1 hora a partir de agora.
   */
  defaultISO?: string | null;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalParts(d: Date) {
  // Converte Date -> partes locais (YYYY-MM-DD / HH:mm)
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return {
    date: `${y}-${m}-${day}`,
    time: `${hh}:${mm}`,
  };
}

// Constrói um ISO UTC a partir de data/hora locais
function localToISO(dateStr: string, timeStr: string) {
  const [h = "00", m = "00"] = timeStr.split(":");
  const parts = dateStr.split("-").map((x) => Number(x));
  const y = parts[0] ?? 1970;
  const mo = (parts[1] ?? 1) - 1;
  const d = parts[2] ?? 1;
  const local = new Date(y, mo, d, Number(h), Number(m), 0, 0);
  return local.toISOString();
}

export default function ScheduleModal({ open, onClose, onConfirm, defaultISO }: Props) {
  const tz = React.useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const nowPlus1h = React.useMemo(() => {
    const n = new Date();
    n.setMinutes(n.getMinutes() + 60);
    return n;
  }, []);

  const initial = React.useMemo(() => (defaultISO ? new Date(defaultISO) : nowPlus1h), [defaultISO, nowPlus1h]);
  const { date: initDate, time: initTime } = React.useMemo(() => toLocalParts(initial), [initial]);

  const [date, setDate] = React.useState(initDate);
  const [time, setTime] = React.useState(initTime);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setBusy(false);
    // reset se for reabrir
    setDate(initDate);
    setTime(initTime);
  }, [open, initDate, initTime]);

  function validate(): string | null {
    if (!date || !time) return "Selecione data e horário.";
    const iso = localToISO(date, time);
    const when = Date.parse(iso);
    if (!Number.isFinite(when)) return "Data/hora inválida.";
    // mínimo: 2 minutos no futuro pra evitar corrida
    if (when < Date.now() + 2 * 60 * 1000) return "Escolha um horário no futuro (≥ 2 min).";
    // limite de 90 dias só pra evitar erros acidentais
    const max = Date.now() + 90 * 24 * 60 * 60 * 1000;
    if (when > max) return "O agendamento deve ser dentro de 90 dias.";
    return null;
  }

  function confirm() {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setBusy(true);
    const iso = localToISO(date, time);
    onConfirm(iso);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* dialog */}
      <div className="relative z-[101] w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200">
        <div className="px-5 py-4 border-b">
          <div className="text-lg font-semibold">Agendar publicação</div>
          <div className="text-xs text-gray-500 mt-1">Fuso horário: {tz}</div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Data</label>
              <input
                type="date"
                className="w-full rounded-md border px-3 py-2"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={toLocalParts(new Date()).date}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Hora</label>
              <input
                type="time"
                className="w-full rounded-md border px-3 py-2"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                step={60}
              />
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-600 mb-1">Sugestões</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="px-2.5 py-1 text-xs rounded-md border hover:bg-gray-50"
                onClick={() => {
                  const d = new Date();
                  d.setMinutes(d.getMinutes() + 15);
                  const p = toLocalParts(d);
                  setDate(p.date);
                  setTime(p.time);
                }}
              >
                +15 min
              </button>
              <button
                className="px-2.5 py-1 text-xs rounded-md border hover:bg-gray-50"
                onClick={() => {
                  const d = new Date();
                  d.setHours(d.getHours() + 1);
                  const p = toLocalParts(d);
                  setDate(p.date);
                  setTime(p.time);
                }}
              >
                +1 hora
              </button>
              <button
                className="px-2.5 py-1 text-xs rounded-md border hover:bg-gray-50"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  d.setHours(9, 0, 0, 0);
                  const p = toLocalParts(d);
                  setDate(p.date);
                  setTime(p.time);
                }}
              >
                Amanhã 09:00
              </button>
            </div>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
          <button className="px-3 py-2 text-sm rounded-md border hover:bg-gray-50" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button
            className="px-3 py-2 text-sm rounded-md bg-[#EE4D2D] text-white hover:bg-[#D8431F] disabled:opacity-60"
            onClick={confirm}
            disabled={busy}
          >
            {busy ? "Agendando…" : "Agendar"}
          </button>
        </div>
      </div>
    </div>
  );
}
