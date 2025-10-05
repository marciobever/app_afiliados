'use client';

import React from 'react';
import { X as XIcon, Copy, Check, Link2, Loader2, CalendarClock } from 'lucide-react';

type PlatformKey = 'facebook' | 'instagram' | 'x';

function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(' ');
}

function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [ok, setOk] = React.useState(false);
  return (
    <button
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#FFD9CF] hover:bg-[#FFF4F0] text-sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text || '');
        setOk(true);
        setTimeout(() => setOk(false), 1200);
      }}
    >
      {ok ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {ok ? 'Copiado' : label}
    </button>
  );
}

/** gera legenda (insta/fb diferentes) */
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

/** monta link com subids */
async function getTrackedUrl(baseUrl: string, platform: PlatformKey) {
  const r = await fetch('/api/integrations/shopee/subids', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base_url: baseUrl, platform }),
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

  React.useEffect(() => {
    async function init() {
      if (!product) return;
      setLoading(true);
      try {
        const [{ url, subids }, generated] = await Promise.all([
          getTrackedUrl(product.url, platform),
          generateCaption(product.title, platform),
        ]);
        setTrackedUrl(url);
        setSubidsUsed(subids);
        setCaption(generated.replace('{link}', url));
      } catch {
        setCaption(`${product.title}\n\nConfira aqui 👉 ${product.url}`);
      } finally {
        setLoading(false);
      }
    }
    if (open && product) init();
  }, [open, product, platform]);

  async function publishNow(scheduleTime?: string) {
    if (!product) return;
    const finalCaption = caption.replace(/\{link\}/g, trackedUrl || product.url);

    await fetch('/api/integrations/n8n/publish', {
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

    alert(scheduleTime ? 'Publicação agendada!' : 'Publicado com sucesso!');
    onClose();
  }

  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
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
          </div>

          {/* Link */}
          <div>
            <label className="text-sm font-medium text-[#374151]">Link com SubIDs</label>
            <div className="mt-1 flex gap-2">
              <input className="w-full border border-[#FFD9CF] rounded px-3 py-2 text-sm" value={trackedUrl} readOnly />
              <CopyButton text={trackedUrl} label="Copiar" />
            </div>
            {!!subidsUsed.length && (
              <div className="mt-1 text-xs text-[#6B7280] flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5" />
                Aplicados: {subidsUsed.join(' · ')}
              </div>
            )}
          </div>

          {/* Caption */}
          <div>
            <label className="text-sm font-medium text-[#374151]">Legenda gerada</label>
            <textarea
              className="mt-1 w-full border border-[#FFD9CF] rounded-lg p-2 text-sm"
              rows={8}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <div className="mt-2 flex gap-2">
              <CopyButton text={caption} label="Copiar legenda" />
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button className="px-4 py-2 rounded-lg border border-[#FFD9CF] hover:bg-[#FFF4F0]" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-[#EE4D2D] hover:bg-[#D8431F] text-white flex items-center gap-2"
            disabled={loading}
            onClick={() => publishNow()}
          >
            {loading && <Loader2 className="animate-spin w-4 h-4" />}
            Publicar
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#1f2937] text-white flex items-center gap-2"
            disabled={loading}
            onClick={() => {
              const when = prompt('Agendar para (ex: 2025-10-05T18:00:00Z):');
              if (when) publishNow(when);
            }}
          >
            <CalendarClock className="w-4 h-4" /> Agendar
          </button>
        </div>
      </aside>
    </div>
  );
}
