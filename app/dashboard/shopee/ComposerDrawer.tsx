'use client';

import React from 'react';
import { X as XIcon, Loader2, CalendarClock, Globe2, Copy } from 'lucide-react';

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

/* ---------------- caption builders ---------------- */

function buildInstagramCaptionFromVariant(v: any) {
  const hook = (v?.hook ?? '').toString().trim();
  const body = (v?.body ?? '').toString().trim();
  const ctas = Array.isArray(v?.cta_lines) ? v.cta_lines.filter(Boolean) : [];
  const hashtags = Array.isArray(v?.hashtags) ? v.hashtags.filter(Boolean) : [];
  const parts = [
    hook,
    body,
    ctas.map((l: string) => `• ${l}`).join('\n'),
    hashtags.join(' '),
  ].filter(Boolean);
  return parts.join('\n\n').trim();
}

function buildFacebookCaptionFromVariant(v: any) {
  const title = (v?.title ?? '').toString().trim();
  const intro = (v?.intro ?? '').toString().trim();
  const bullets = Array.isArray(v?.bullets) ? v.bullets.filter(Boolean) : [];
  const cta = (v?.cta ?? '').toString().trim();
  const hashtags = Array.isArray(v?.hashtags) ? v.hashtags.filter(Boolean) : [];
  const parts = [
    title,
    intro,
    bullets.map((b: string) => `• ${b}`).join('\n'),
    cta,
    hashtags.join(' '),
  ].filter(Boolean);
  return parts.join('\n\n').trim();
}

/* ---------------- API helpers ---------------- */

async function fetchCaption({
  platform,
  productTitle,
  keyword = 'oferta',
}: {
  platform: PlatformKey;
  productTitle: string;
  keyword?: string;
}) {
  const kind =
    platform === 'instagram'
      ? 'instagram_caption'
      : platform === 'facebook'
      ? 'facebook_caption'
      : 'instagram_caption';

  const res = await fetch('/api/caption', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind,
      // o n8n aceita lista de products; passamos um mínimo
      products: [{ title: productTitle }],
      keyword, // usado no IG
    }),
  });

  const data = await res.json();
  if (!res.ok || data?.error) {
    throw new Error(data?.message || data?.error || 'Falha ao gerar legenda');
  }

  // o seu n8n retorna algo como { variants: [...] } (às vezes encapsulado)
  const variants = Array.isArray(data?.variants)
    ? data.variants
    : Array.isArray(data?.[0]?.variants)
    ? data[0].variants
    : [];

  if (!variants.length) return '';

  if (platform === 'facebook') {
    return buildFacebookCaptionFromVariant(variants[0]);
  }
  return buildInstagramCaptionFromVariant(variants[0]);
}

async function getTrackedUrl(baseUrl: string, platform: PlatformKey, product?: Product) {
  const r = await fetch('/api/integrations/shopee/subids', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      base_url: baseUrl,
      platform,
      product, // útil para o node 6 montar subids
    }),
  });
  const j = await r.json();
  if (!r.ok || j?.error) throw new Error(j?.error || 'Falha ao montar SubIDs');
  return {
    url: (j.url as string) || '',
    subids: (j.subids_used as string[]) || [],
  };
}

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

/* ---------------- Component ---------------- */

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
  const [caption, setCaption] = React.useState('');
  const [subidsUsed, setSubidsUsed] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [errMsg, setErrMsg] = React.useState<string | null>(null);

  // reset ao mudar plataforma ou abrir
  React.useEffect(() => {
    if (!open) return;
    setTrackedUrl('');
    setCaption('');
    setSubidsUsed([]);
    setErrMsg(null);
  }, [open, platform]);

  async function generateAll() {
    if (!product) return;
    setLoading(true);
    setErrMsg(null);
    try {
      const [{ url, subids }, cap] = await Promise.all([
        getTrackedUrl(product.url, platform, product),
        fetchCaption({ platform, productTitle: product.title }),
      ]);
      const finalCap = cap?.includes('{link}')
        ? cap.replace(/\{link\}/g, url || product.url)
        : `${cap}\n\nConfira aqui 👉 ${url || product.url}`;
      setTrackedUrl(url);
      setSubidsUsed(subids);
      setCaption(finalCap.trim());
    } catch (e: any) {
      setTrackedUrl('');
      setSubidsUsed([]);
      setCaption(`${product.title}\n\nConfira aqui 👉 ${product?.url ?? ''}`);
      setErrMsg(e?.message || 'Falha ao gerar link/legenda');
    } finally {
      setLoading(false);
    }
  }

  async function publishNow(scheduleTime?: string) {
    if (!product) return;
    if (!trackedUrl) {
      setErrMsg('Gere o link + legenda antes de publicar.');
      return;
    }
    setLoading(true);
    setErrMsg(null);
    try {
      const finalCaption = caption.replace(/\{link\}/g, trackedUrl || product.url).trim();
      await publishToSocial({ platform, product, trackedUrl, caption: finalCaption, scheduleTime });
      alert(scheduleTime ? 'Publicação agendada com sucesso!' : 'Publicado com sucesso!');
      onClose();
    } catch (e: any) {
      setErrMsg(e?.message || 'Erro ao publicar nas redes sociais');
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

          {/* Erro (se houver) */}
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
              Clique em <b>Gerar link + legenda</b> para criar os SubIDs e a legenda desta plataforma.
            </p>
          </div>

          {/* Ação de geração */}
          <div>
            <button
              onClick={generateAll}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-[#EE4D2D] hover:bg-[#D8431F] text-white disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Gerando…
                </span>
              ) : (
                'Gerar link + legenda'
              )}
            </button>
          </div>

          {/* Link rastreável */}
          <div>
            <label className="text-sm font-medium text-[#374151]">Link com SubIDs</label>
            <div className="mt-1 flex gap-2">
              <input
                className="w-full border border-[#FFD9CF] rounded px-3 py-2 text-sm"
                value={trackedUrl || '—'}
                readOnly
              />
              <button
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#FFD9CF] hover:bg-[#FFF4F0] text-sm"
                onClick={async () => {
                  if (!trackedUrl) return;
                  await navigator.clipboard.writeText(trackedUrl);
                }}
                disabled={!trackedUrl}
              >
                <Copy className="w-4 h-4" /> Copiar
              </button>
            </div>
            {!!subidsUsed.length && (
              <div className="mt-1 text-xs text-[#6B7280]">
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
              placeholder="Clique em “Gerar link + legenda” para preencher automaticamente."
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
            className="px-4 py-2 rounded-lg bg-[#EE4D2D] hover:bg-[#D8431F] text-white disabled:opacity-60"
            disabled={publishDisabled}
            onClick={() => publishNow()}
          >
            Publicar
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#1f2937] text-white disabled:opacity-60"
            disabled={publishDisabled}
            onClick={() => {
              const when = prompt('Agendar (ex: 2025-10-05T18:00:00Z):');
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
