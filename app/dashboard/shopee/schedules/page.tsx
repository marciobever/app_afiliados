// app/dashboard/shopee/schedules/page.tsx
'use client';

import * as React from 'react';

type Item = {
  id: string;
  provider: string;
  platform: string;
  caption: string | null;
  image_url: string | null;
  shortlink: string | null;
  scheduled_at: string | null; // ISO
  status: 'queued'|'claimed'|'done'|'error'|'canceled';
};

const STATUSES = ['queued','claimed','error','done','canceled'] as const;

export default function SchedulesPage() {
  const [items, setItems] = React.useState<Item[]>([]);
  const [status, setStatus] = React.useState<(typeof STATUSES[number])|'all'>('queued');
  const [loading, setLoading] = React.useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/schedules?status=${status}`, { cache: 'no-store' });
    const j = await r.json();
    setItems(Array.isArray(j.items) ? j.items : []);
    setLoading(false);
  }

  React.useEffect(() => { load(); }, [status]);

  async function cancel(id: string) {
    if (!confirm('Cancelar este agendamento?')) return;
    const r = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
    if (r.ok) {
      setItems(prev => prev.filter(x => x.id !== id));
    } else {
      const j = await r.json().catch(() => ({}));
      alert(j?.error ?? 'Falha ao cancelar.');
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Meus agendamentos</h1>

      <div className="flex gap-2 items-center">
        {(['all', ...STATUSES] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded border ${status===s ? 'bg-black text-white' : 'bg-white'}`}
          >
            {s}
          </button>
        ))}
        <button onClick={load} className="ml-auto px-3 py-1.5 rounded border">Atualizar</button>
      </div>

      {loading ? (
        <div>Carregando…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-500">Nenhum item.</div>
      ) : (
        <div className="grid gap-3">
          {items.map(it => (
            <div key={it.id} className="rounded-2xl border p-3 flex gap-3">
              {it.image_url ? (
                <img src={it.image_url} alt="" className="w-16 h-16 rounded object-cover border" />
              ) : <div className="w-16 h-16 rounded bg-gray-100 border" />}
              <div className="min-w-0 flex-1">
                <div className="text-xs text-gray-500">{it.provider} • {it.platform} • <b>{it.status}</b></div>
                <div className="font-medium line-clamp-2">{it.caption || '(sem legenda)'}</div>
                <div className="text-xs text-gray-500">
                  {it.scheduled_at ? new Date(it.scheduled_at).toLocaleString() : 'sem data'}
                  {it.shortlink ? <> • <a className="underline" href={it.shortlink} target="_blank">link</a></> : null}
                </div>
              </div>
              {(it.status === 'queued' || it.status === 'claimed') && (
                <button
                  onClick={() => cancel(it.id)}
                  className="self-start px-3 py-1.5 rounded border bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
