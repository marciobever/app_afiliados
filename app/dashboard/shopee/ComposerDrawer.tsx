'use client';

import React from 'react';
import { X as XIcon, Loader2, CalendarClock, CheckCircle2, AlertCircle } from 'lucide-react';

type PlatformKey = 'facebook' | 'instagram' | 'x';

function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(' ');
}

// Gera legenda com CTA (Gemini no backend)
async function generateCaption(title: string, platform: PlatformKey) {
  const r = await fetch('/api/ai/gemini-caption', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, platform }),
  });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || 'Falha ao gerar legenda');
  return j.caption as string;
}

// Pede o link rastreado ao webhook 2 via proxy Next
async function getTrackedUrl(baseUrl: string, platform: PlatformKey, product: any) {
  const r = await fetch('/api/integrations/shopee/subids', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base_url: baseUrl, platform, product }),
  });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || 'Falha ao montar SubIDs');
  return { url: j.url as string, subids: (j.subids_used as string[]) || [] };
}

export default function ComposerDrawer({
  open,
  onClose,
  product,
}: {
  open: boolean;
  onClose: () => void;
  product: null | {
    id: string;
    title: string;
    price: number;
    rating: number;
    image: string;
    url: string;
  };
}) {
  const [platform, setPlatform] = React.useState<PlatformKey>('facebook');
  const [trackedUrl, setTrackedUrl] = React.useState('');
  const [caption, setCaption] = React.useState('');
  const [subidsUsed, setSubidsUsed] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<{ type: 'ok' | 'err' | null; msg: string }>({ type: null, msg: '' });

  // gera automaticamente: link com subids + legenda
  React.useEffect(() => {
    async function init() {
      if (!product) return;
      setLoading(true);
      setStatus({ type: null, msg: '' });
      try {
        const [{ url, subids }, generated] = await Promise.all([
          getTrackedUrl(product.url, platform, product),
          generateCaption(product.title, platform),
        ]);
        setTrackedUrl(url);
        setSubidsUsed(subids);
        setCaption(generated.replace('{link}', url));
      } catch (e: any) {
        setCaption(`${product.title}\n\nConfira aqui 👉 ${product?.url ?? ''}`);
        setTrackedUrl(product?.url ?? '');
        setSubidsUsed([]);
        setStatus({ type: 'err', msg: e?.message || 'Não foi possível preparar link/legenda.' });
      } finally {
        setLoading(false);
      }
    }
    if (open && product) init();
  }, [open, product, platform]);

  // publicar/agendar
  async function publishNow(scheduleTime?: string) {
    if (!product) return;
    setLoading(true);
    setStatus({ type: null, msg: '' });
    try {
      const finalCaption = caption.replace(/\{link\}/g, trackedUrl || product.url);

      const resp = await fetch('/api/integrations/n8n/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          product,
          trackedUrl,
          subidsUsed,
          caption: finalCaption,
          scheduleTime: scheduleTime || null,
        }),
      });

      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(t || `HTTP ${resp.status}`);
      }

      setStatus({
        type: 'ok',
        msg: scheduleTime ? 'Publicação agendada!' : 'Publicado com sucesso!',
      });
      // fecha após pequeno delay
      setTimeout(onClose, 900);
    } catch (e: any) {
      setStatus({ type: 'err', msg: e?.message || 'Falha ao publicar.' });
    } finally {
      setLoading(false);
    }
  }

  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* painel */}
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white border-l shadow-xl flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-semibold">Composer</div>
          <button className="p-2 rounded hover:bg-[#FFF4F0]" aria-label="Fechar" onClick={onClose}>
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-auto">
          {/* Produto */}
          <div className="flex gap-3">
            <img src={product.image} alt="" className="w-20 h-20 rounded object-cover" />
            <div className="min-w-0">
              <div className="font-medium line-clamp-2">{product.title}</div>
              <div className="text-sm text-gray-600">R$ {product.price.toFixed(2)}</div>
              <div className="text-xs text-gray-500">ID: {product.id}</div>
            </div>
          </div>

          {/* Plataforma */}
          <div>
            <label className="text-sm font-medium text-[#374151]">Plataforma</label>
            <div className="mt-2 flex gap-2">
              {(['facebook', 'instagram', 'x'] as PlatformKey[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  disabled={loading}
                  className={cx(
                    'px-3 py-1.5 rounded-lg border text-sm',
                    platform === p
                      ? 'bg-[#EE4D2D] text-white border-[#EE4D2D]'
                      : 'bg-white border-[#FFD9CF] hover:bg-[#FFF4F0]'
                  )}
                >
                  {p === 'x' ? 'X (Twitter)' : p[0].toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#6B7280] mt-1">
              O link rastreado (com SubIDs) é gerado automaticamente conforme a plataforma.
            </p>
          </div>

          {/* Caption */}
          <div>
            <label className="text-sm font-medium text-[#374151]">Legenda</label>
            <textarea
              className="mt-1 w-full border border-[#FFD9CF] rounded-lg p-2 text-sm"
              rows={8}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            {!!subidsUsed.length && (
              <p className="mt-1 text-xs text-[#6B7280]">
                SubIDs aplicados: <span className="font-medium">{subidsUsed.join(' · ')}</span>
              </p>
            )}
          </div>

          {/* status */}
          {status.type && (
            <div
              className={cx(
                'flex items-center gap-2 text-sm rounded-lg p-2 border',
                status.type === 'ok'
                  ? 'text-green-700 border-green-200 bg-green-50'
                  : 'text-red-700 border-red-200 bg-red-50'
              )}
            >
              {status.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {status.msg}
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button className="px-4 py-2 rounded-lg border border-[#FFD9CF] hover:bg-[#FFF4F0]" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-[#EE4D2D] hover:bg-[#D8431F] text-white flex items-center gap-2 disabled:opacity-60"
            disabled={loading}
            onClick={() => publishNow()}
          >
            {loading && <Loader2 className="animate-spin w-4 h-4" />}
            Publicar
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#1f2937] text-white flex items-center gap-2 disabled:opacity-60"
            disabled={loading}
            onClick={() => {
              const when = prompt('Agendar para (ex: 2025-10-05T18:00:00Z):');
              if (when) publishNow(when);
            }}
          >
            <CalendarClock className="w-4 h-4" />
            Agendar
          </button>
        </div>
      </aside>
    </div>
  );
}
