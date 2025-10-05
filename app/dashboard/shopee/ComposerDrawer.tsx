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
  Sparkles,
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

// —— Helpers de legenda (monta string a partir do JSON do /api/caption)
function buildInstagramCaption(v: any, keyword: string) {
  if (!v) return '';
  const blocks = [
    (v.hook || '').trim(),
    (v.body || '').trim(),
    Array.isArray(v.cta_lines) && v.cta_lines.length
      ? v.cta_lines.join('\n').trim()
      : `Comente "${keyword}" que te envio o link por DM.`,
    Array.isArray(v.hashtags) ? v.hashtags.join(' ').trim() : '',
  ].filter(Boolean);
  return blocks.join('\n\n');
}

function buildFacebookCaption(v: any) {
  if (!v) return '';
  const blocks = [
    (v.title || '').trim(),
    (v.intro || '').trim(),
    Array.isArray(v.bullets) && v.bullets.length
      ? v.bullets.map((b: string) => (b.startsWith('•') ? b : `• ${b}`)).join('\n').trim()
      : '',
    (v.cta || '').trim(),
    Array.isArray(v.hashtags) ? v.hashtags.join(' ').trim() : '',
  ].filter(Boolean);
  return blocks.join('\n\n');
}

// —— Deriva ID da Shopee pela URL
function deriveShopeeIdFromUrl(url?: string): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    const idx = parts.findIndex((p) => p.toLowerCase() === 'product');
    if (idx >= 0 && parts[idx + 1] && parts[idx + 2]) {
      return `${parts[idx + 1]}_${parts[idx + 2]}`;
    }
  } catch {}
  return '';
}

/** 🔹 Gera link rastreável (via webhook n8n de SubIDs) — agora SEMPRE com product válido */
async function getTrackedUrl(
  baseUrl: string,
  platform: PlatformKey,
  product: Product | undefined
) {
  const safeProduct: Product = {
    id:
      (product?.id && String(product.id)) ||
      deriveShopeeIdFromUrl(product?.url || baseUrl) ||
      deriveShopeeIdFromUrl(baseUrl),
    title: product?.title ?? '',
    price:
      typeof product?.price === 'number'
        ? product.price
        : product?.price
        ? Number(product.price)
        : (null as any),
    rating:
      typeof product?.rating === 'number'
        ? product.rating
        : product?.rating
        ? Number(product.rating)
        : (null as any),
    image: product?.image ?? '',
    url: product?.url ?? baseUrl,
  };

  const r = await fetch('/api/integrations/shopee/subids', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      base_url: baseUrl,
      platform,
      product: safeProduct,
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || 'Falha ao montar SubIDs');
  return {
    url: (j.url as string) || '',
    subids: (j.subids_used as string[]) || [],
  };
}

/** 🔹 Gera legenda automática via /api/caption (n8n) */
async function generateCaptionViaN8n(product: Product, platform: PlatformKey) {
  const kind =
    platform === 'instagram' ? 'instagram_caption' : platform === 'facebook' ? 'facebook_caption' : 'facebook_caption';

  const res = await fetch('/api/caption', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind,
      style: 'Minimal',
      keyword: 'oferta',
      products: [
        {
          id: product.id || deriveShopeeIdFromUrl(product.url),
          title: product.title,
          price: product.price ?? null,
          rating: product.rating ?? null,
          url: product.url,
        },
      ],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) {
    throw new Error(data?.error || 'Falha ao gerar legenda');
  }

  // Normaliza formatos possíveis (direto ou embrulhado)
  const payload = Array.isArray(data) ? data[0] : data;
  const keyword = payload?.keyword || 'oferta';
  const variants = Array.isArray(payload?.variants) ? payload.variants : [];

  // Apenas 1ª variação (usuário pode editar)
  if (platform === 'instagram') {
    return buildInstagramCaption(variants[0], keyword);
  } else {
    return buildFacebookCaption(variants[0]);
  }
}

/** 🔹 Publica nas redes (via webhook n8n /webhook/social) */
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
  const [caption, setCaption] = React.useState('');
  const [subidsUsed, setSubidsUsed] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [errMsg, setErrMsg] = React.useState<string | null>(null);
  const [generating, setGenerating] = React.useState(false);

  // Quando abrir: limpa estados
  React.useEffect(() => {
    if (!open) return;
    setTrackedUrl('');
    setSubidsUsed([]);
    setCaption('');
    setErrMsg(null);
    setGenerating(false);
  }, [open]);

  async function handleGenerate() {
    if (!product) return;
    setErrMsg(null);
    setGenerating(true);
    try {
      // 1) subids
      const { url, subids } = await getTrackedUrl(product.url, platform, product);
      setTrackedUrl(url);
      setSubidsUsed(subids);

      // 2) caption
      const txt = await generateCaptionViaN8n(
        {
          id: product.id || deriveShopeeIdFromUrl(product.url),
          title: product.title,
          price: product.price,
          rating: product.rating,
          image: product.image,
          url: product.url,
        },
        platform
      );
      setCaption(txt || `${product.title}\n\nConfira aqui 👉 ${url || product.url}`);
    } catch (e: any) {
      setErrMsg(e?.message || 'Falha ao gerar link/legenda');
      setCaption(`${product?.title ?? ''}\n\nConfira aqui 👉 ${product?.url ?? ''}`);
    } finally {
      setGenerating(false);
    }
  }

  async function publishNow(scheduleTime?: string) {
    if (!product) return;
    if (!trackedUrl) {
      setErrMsg('Gere o link/legenda antes de publicar.');
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

  const publishDisabled = loading || generating || !trackedUrl;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[540px] bg-white border-l shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-semibold flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-[#EE4D2D]" />
            Composer
          </div>
          <button className="p-2 rounded hover:bg-[#FFF4F0]" aria-label="Fechar" onClick={onClose}>
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-auto">
          {/* Produto */}
          <div className="flex gap-3">
            <img src={product.image} alt="" className="w-20 h-20 rounded object-cover" />
            <div className="min-w-0">
              <div className="font-medium line-clamp-2">{product.title}</div>
              <div className="text-sm text-gray-600">R$ {Number(product.price).toFixed(2)}</div>
              <div className="text-xs text-gray-500">ID: {product.id || deriveShopeeIdFromUrl(product.url)}</div>
            </div>
          </div>

          {/* Erro (se houver) */}
          {errMsg && (
            <div className="p-2 text-sm rounded-md border border-[#FFD9CF] bg-[#FFF4F0] text-[#B42318]">
              {errMsg}
            </div>
          )}

          {/* Plataforma + Gerar */}
          <div className="flex items-end justify-between gap-3">
            <div className="flex-1">
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
                    disabled={generating || loading}
                  >
                    {p === 'x' ? 'X (Twitter)' : p[0].toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || loading}
              className={cx(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition',
                'border border-[#FFD9CF]',
                generating || loading
                  ? 'bg-[#FFF4F0] text-[#6B7280] cursor-not-allowed'
                  : 'bg-white hover:bg-[#FFF4F0] text-[#111827]'
              )}
              title="Gerar link (SubIDs) + legenda"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-[#EE4D2D]" />}
              {generating ? 'Gerando…' : 'Gerar Legenda'}
            </button>
          </div>

          {/* Link rastreável */}
          <div>
            <label className="text-sm font-medium text-[#374151]">Link com SubIDs</label>
            <div className="mt-1 flex gap-2">
              <input
                className="w-full border border-[#FFD9CF] rounded px-3 py-2 text-sm"
                value={trackedUrl}
                readOnly
                placeholder={generating ? 'Gerando…' : '—'}
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

          {/* Legenda (editável) */}
          <div>
            <label className="text-sm font-medium text-[#374151]">Legenda</label>
            <textarea
              className="mt-1 w-full border border-[#FFD9CF] rounded-lg p-2 text-sm"
              rows={10}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={generating ? 'Gerando legenda…' : 'Escreva/edite sua legenda'}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded-lg border border-[#FFD9CF] hover:bg-[#FFF4F0]"
            onClick={onClose}
            disabled={loading || generating}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-[#EE4D2D] hover:bg-[#D8431F] text-white flex items-center gap-2 disabled:opacity-60"
            disabled={publishDisabled}
            onClick={() => publishNow()}
          >
            {(loading || generating) && <Loader2 className="animate-spin w-4 h-4" />}
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
