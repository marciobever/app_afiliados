'use client';

import React from 'react';
import { X as XIcon, Copy, Check, Link2 } from 'lucide-react';

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

/** Chama o endpoint de SubIDs e retorna a URL final com subid1..5 aplicados */
async function getTrackedUrl(baseUrl: string, platform: PlatformKey) {
  const r = await fetch('/api/integrations/shopee/subids', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base_url: baseUrl, platform }),
  });
  const j = await r.json();
  if (!r.ok || j?.error) throw new Error(j?.error || 'Falha ao montar SubIDs');
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
  const platforms: PlatformKey[] = ['facebook', 'instagram', 'x'];
  const [platform, setPlatform] = React.useState<PlatformKey>('facebook');
  const [trackedUrl, setTrackedUrl] = React.useState('');
  const [subidsUsed, setSubidsUsed] = React.useState<string[]>([]);
  const [loadingUrl, setLoadingUrl] = React.useState(false);
  const [caption, setCaption] = React.useState('');

  React.useEffect(() => {
    if (!product) return;
    setCaption(`${product.title}\n\nConfira aqui 👉 {link}`);
  }, [product]);

  async function refreshUrl() {
    if (!product) return;
    setLoadingUrl(true);
    try {
      const { url, subids } = await getTrackedUrl(product.url, platform);
      setTrackedUrl(url);
      setSubidsUsed(subids);
    } catch {
      // opcional: toast
    } finally {
      setLoadingUrl(false);
    }
  }

  React.useEffect(() => {
    if (open && product) refreshUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product, platform]);

  async function publishNow() {
    // TODO: plugue no seu backend/n8n
    const finalCaption = caption.replace(/\{link\}/g, trackedUrl || product?.url || '');
    console.log('PUBLISH:', {
      platform,
      product_id: product?.id,
      link: trackedUrl,
      subidsUsed,
      caption: finalCaption,
    });
    alert('Mock: publicar/agendar\n\n' + finalCaption);
  }

  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* panel */}
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white border-l shadow-xl flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-semibold">Composer</div>
          <button
            className="p-2 rounded hover:bg-[#FFF4F0]"
            aria-label="Fechar"
            onClick={onClose}
          >
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
              {platforms.map((p) => (
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
            <p className="text-xs text-[#6B7280] mt-1">
              O link já sai com os SubIDs desta plataforma.
            </p>
          </div>

          {/* Link com SubIDs */}
          <div>
            <label className="text-sm font-medium text-[#374151]">Link com SubIDs</label>
            <div className="mt-1 flex gap-2">
              <input
                className="w-full border border-[#FFD9CF] rounded px-3 py-2 text-sm"
                value={trackedUrl}
                readOnly
                placeholder="Gerando…"
              />
              <button
                className="px-3 py-2 rounded-lg border border-[#FFD9CF] hover:bg-[#FFF4F0] text-sm whitespace-nowrap"
                onClick={refreshUrl}
                disabled={loadingUrl}
              >
                {loadingUrl ? 'Atualizando…' : 'Atualizar'}
              </button>
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
            <label className="text-sm font-medium text-[#374151]">Caption</label>
            <textarea
              className="mt-1 w-full border border-[#FFD9CF] rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D]"
              rows={8}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Escreva sua legenda. Dica: use {link} para inserir a URL rastreada."
            />
            <div className="mt-2 flex gap-2">
              <CopyButton
                text={caption.replace(/\{link\}/g, trackedUrl || product.url)}
                label="Copiar legenda"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded-lg border border-[#FFD9CF] hover:bg-[#FFF4F0]"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-[#EE4D2D] hover:bg-[#D8431F] text-white"
            onClick={publishNow}
          >
            Publicar/Agendar
          </button>
        </div>
      </aside>
    </div>
  );
}
