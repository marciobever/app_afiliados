// app/dashboard/shopee/schedules/schedules-client.tsx
'use client';

import * as React from 'react';

type Row = {
  id: string;
  provider: 'instagram' | 'meta';
  platform: 'instagram' | 'facebook' | 'x';
  caption: string | null;
  image_url: string | null;
  shortlink: string | null;
  scheduled_at: string | null;
  status: 'queued' | 'claimed' | 'error' | 'done' | 'canceled';
};

export default function SchedulesClient({ initialItems }: { initialItems: Row[] }) {
  const [items, setItems] = React.useState<Row[]>(initialItems);
  const [status, setStatus] = React.useState<'all' | Row['status']>('all');
  const [loading, setLoading] = React.useState(false);

  async function reload(newStatus = status) {
    setLoading(true);
    try {
      const q = newStatus === 'all' ? '' : `?status=${encodeURIComponent(newStatus)}`;
      const res = await fetch(`/api/schedules${q}`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok) setItems(json.items || []);
      else alert(json.error || 'Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  }

  async function cancel(id: string) {
    if (!confirm('Cancelar este agendamento?')) return;
    const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) {
      alert(json.error || 'Falha ao cancelar');
      return;
    }
    // Atualiza localmente
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'canceled' } as Row : r)));
  }

  React.useEffect(() => {
    reload(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Status:</label>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          disabled={loading}
        >
          <option value="all">Todos</option>
          <option value="queued">Queued</option>
          <option value="claimed">Claimed</option>
          <option value="done">Done</option>
          <option value="error">Error</option>
          <option value="canceled">Canceled</option>
        </select>
        <button
          className="ml-auto border rounded px-3 py-1.5 text-sm hover:bg-gray-50"
          onClick={() => reload()}
          disabled={loading}
        >
          {loading ? 'Atualizando…' : 'Atualizar'}
        </button>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-[800px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-3 py-2">Quando</th>
              <th className="px-3 py-2">Plataforma</th>
              <th className="px-3 py-2">Legenda</th>
              <th className="px-3 py-2">Link</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 w-28"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                  Nenhum agendamento.
                </td>
              </tr>
            )}
            {items.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2 align-top">
                  {r.scheduled_at
                    ? new Date(r.scheduled_at).toLocaleString()
                    : <span className="text-gray-500">—</span>}
                </td>
                <td className="px-3 py-2 align-top">
                  <div className="uppercase text-xs text-gray-500">{r.provider}</div>
                  <div>{r.platform}</div>
                </td>
                <td className="px-3 py-2 align-top max-w-[360px]">
                  <div className="line-clamp-3 whitespace-pre-line">{r.caption || '—'}</div>
                </td>
                <td className="px-3 py-2 align-top">
                  {r.shortlink ? (
                    <a className="text-blue-600 underline break-all" href={r.shortlink} target="_blank">
                      {r.shortlink}
                    </a>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="px-3 py-2 align-top">
                  <span
                    className={[
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs',
                      r.status === 'queued' && 'bg-amber-100 text-amber-800',
                      r.status === 'claimed' && 'bg-blue-100 text-blue-800',
                      r.status === 'done' && 'bg-emerald-100 text-emerald-800',
                      r.status === 'error' && 'bg-red-100 text-red-800',
                      r.status === 'canceled' && 'bg-gray-200 text-gray-700',
                    ].filter(Boolean).join(' ')}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2 align-top">
                  {(r.status === 'queued' || r.status === 'claimed') ? (
                    <button
                      className="border rounded px-2 py-1 hover:bg-gray-50"
                      onClick={() => cancel(r.id)}
                    >
                      Cancelar
                    </button>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
