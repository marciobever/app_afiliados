'use client';

import React from 'react';
import {
  X as XIcon,
  Copy,
  Check,
  Link2,
  Loader2,
  CalendarClock,
  Globe2,
} from 'lucide-react';

type PlatformKey = 'facebook' | 'instagram' | 'x';

type Product = {
  id: string;
  title: string;
  price: number;
  rating: number;
  image: string;
  url: string;
};

function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(' ');
}

function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [ok, setOk] = React.useState(false);
  return (
    <button
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#FFD9CF] hover:bg-[#FFF4F0] text-sm disabled:opacity-50"
      onClick={async () => {
        if (!text) return;
        await navigator.clipboard.writeText(text || '');
        setOk(true);
        setTimeout(() => setOk(false), 1200);
      }}
      disabled={!text}
    >
      {ok ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {ok ? 'Copiado' : label}
    </button>
  );
}

/** 🔹 IA de legendas por plataforma */
async function generateCaption(title: string, platform: PlatformKey) {
  // usa o proxy já existente /api/caption → n8n (que decide o prompt/estilo)
  const kind =
    platform === 'instagram' ? 'instagram_caption'
    : platform === 'facebook' ? 'facebook_caption'
    : 'facebook_caption';

  const r = await fetch('/api/caption', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, products: [{ title }], style: 'Default' }),
  });

  const j = await r.json().catch(() => ({}));
  if (!r.ok || j?.error) {
    // fallback: tenta o endpoint Gemini se existir
    const r2 = await fetch('/api/ai/gemini-caption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, platform }),
    });
    const j2 = await r2.json().catch(() => ({}));
    if (!r2.ok || j2?.error) throw new Error(j?.error || j2?.error || 'Falha ao gerar legenda');
    return (j2.caption as string) || '';
  }
  // /api/caption pode devolver { caption } ou um objeto com variants
  const caption =
    j?.caption ??
    j?.data?.caption ??
    j?.result?.caption ??
    (Array.isArray(j?.variants) ? j.variants[0] : '') ??
    '';
  return String(caption || '');
}

/** 🔹 Link rastreável (webhook n8n de SubIDs) */
async function getTrackedUrl(baseUrl: string, platform: PlatformKey, product: Product) {
  const r = await fetch('/api/integrations/shopee/subids', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      base_url: baseUrl,
      platform,
      product, // importante p/ montar subIds com item_id etc.
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j?.error) throw new Error(j?.error || 'Falha ao montar SubIDs');
  return {
    url: (j.url as string) || '',
    subids: (j.subids_used as string[]) || [],
  };
}

/** 🔹 Publica nas redes (webhook n8n /webhook/social via proxy) */
async function publishToSocial({
  platform,
  product,
  trackedUrl,
  caption,
  scheduleTime,
}: {
  platform: PlatformKey;
  product: Product;
  trackedUrl: string;
  caption: string;
  scheduleTime?: string;
}) {
  const r = await fetch('/api/integrations/n8n/social', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      platform,
      product,
      trackedUrl,
      caption,
      scheduleTime: scheduleTime || null,
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j?.error) throw new Error(j?.error || 'Falha ao publicar nas redes sociais');
}

export default function ComposerDrawer({
  open,
  onClose,
  product,
}: {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}) {
  const [platform, setPlatform] = React.useState<PlatformKey>('facebook');
  const [trackedUrl, setTrackedUrl] = React.useState('');
  const [subidsUsed, setSubidsUsed] = React.useState<string[]>([]);
  const [caption, setCaption] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errMsg, setErrMsg] = React.useState<string | null>(null);

  // Sempre que abrir ou trocar plataforma/produto, recarrega link + legenda
  React.useEffect(() => {
    if (!open || !product) return;

    let cancelled = false;
    async function load() {
      setLoading(true);
      setErrMsg(null);
      setTrackedUrl('');
      setSubidsUsed([]);
      setCaption('');

      try {
        const [{ url, subids }, generated] = await Promise.all([
          getTrackedUrl(product.url, platform, product),
          generateCaption(product.title, platform),
        ]);
        if (cancelled) return;

        const finalCaption = (generated || '').replace('{link}', url || product.url);
        setTrackedUrl(url);
        setSubidsUsed(subids);
        setCaption(finalCaption || `${product.title}\n\nConfira aqui 👉 ${url || product.url}`);
      } catch (e: any) {
        if (cancelled) return;
        setTrackedUrl('');
        setSubidsUsed([]);
        setCaption(`${product.title}\n\nConfira aqui 👉 ${product.url}`);
        setErrMsg(e?.message || 'Falha ao preparar link/legenda');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [open, product, platform]);

  async function publishNow(scheduleTime?: string) {
    if (!product) return;
    if (!trackedUrl) {
      alert('Aguarde gerar o link rastreável antes de publicar.');
      return;
    }
    const finalCaption = caption.replace(/\{link\}/g, trackedUrl || product.url).trim();

    setLoading(true);
    setErrMsg(null);
    try {
      await publishToSocial({ platform, product, trackedUrl, caption: finalCaption, scheduleTime });
      alert(scheduleTime ? 'Publicação agendada com sucesso!' : 'Publicado com sucesso!');
      onClose();
    } catch (err: any) {
      setErrMsg(err?.message || 'Erro ao publicar nas redes sociais');
    } finally {
      setLoading(false);
    }
  }

  if (!open || !product) return null;

  const publishDisabled = loading || !trackedUrl;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white border-l shadow-xl flex flex-col">
        {/* Cabeçalho */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-semibold flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-[#EE4D2D]" />
            Composer
          </div>
          <button className="p-2 rounded hover:bg-[#FFF4F0]" aria-label="Fechar" onClick={onClose}>
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-4 space-y-4 overflow-auto">
          {/* Produto */}
          <div className="flex gap-3">
            <img src={product.image} alt="" className="w-20 h-20 rounded object-cover" />
            <div className="min-w-0">
              <div className="font-medium line-clamp-2">{product.title}</div>
              <div className="text-sm text-gray-600">R$ {Number(product.price).toFixed(2)}</div>
              <div className="text-xs text-gray-500">ID: {product.id}</div>
            </div>
          </div>

          {/* Erro */}
          {errMsg && (
            <div className="p-2 text-sm rounded-md border border-[#FFD9CF] bg-[#FFF4F0] text-[#B42318]">
              {errMsg}
            </div>
          )}

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
            <p className="text-xs text-[#6B7280] mt-1">
              Ao trocar a plataforma, o link com SubIDs e a legenda são gerados automaticamente.
            </p>
          </div>

          {/* Link rastreável */}
          <div>
            <label className="text-sm font-medium text-[#374151]">Link com SubIDs</label>
            <div className="mt-1 flex gap-2">
              <input
                className="w-full border border-[#FFD9CF] rounded px-3 py-2 text-sm"
                value={trackedUrl}
                readOnly
                placeholder={loading ? 'Gerando…' : '—'}
              />
              <CopyButton text={trackedUrl} label="Copiar" />
            </div>
            {!!subidsUsed.length && (
              <div className="mt-1 text-xs text-[#6B7280] flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5" />
                Aplicados: {subidsUsed.join(' · ')}
              </div>
            )}
          </div>

          {/* Legenda */}
          <div>
            <label className="text-sm font-medium text-[#374151]">Legenda</label>
            <textarea
              className="mt-1 w-full border border-[#FFD9CF] rounded-lg p-2 text-sm"
              rows={8}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={loading ? 'Gerando legenda…' : 'Escreva/edite sua legenda'}
            />
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded-lg border border-[#FFD9CF] hover:bg-[#FFF4F0]"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-[#EE4D2D] hover:bg-[#D8431F] text-white flex items-center gap-2 disabled:opacity-60"
            disabled={publishDisabled}
            onClick={() => publishNow()}
          >
            {loading && <Loader2 className="animate-spin w-4 h-4" />}
            Publicar
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#1f2937] text-white flex items-center gap-2 disabled:opacity-60"
            disabled={publishDisabled}
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
