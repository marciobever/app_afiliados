// app/dashboard/shopee/ComposerDrawer.tsx
'use client';

import React from 'react';
import {
  X as XIcon,
  Copy,
  Check,
  Loader2,
  CalendarClock,
  Globe2,
  Wand2,
  Link as LinkIcon,
  MessageSquareText,
} from 'lucide-react';

type PlatformKey = 'facebook' | 'instagram' | 'x';

type Product = {
  id: string;
  title: string;
  price: number | null;
  rating: number | null;
  image: string;
  url: string;
};

function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(' ');
}

function platformLabel(p: PlatformKey) {
  if (p === 'x') return 'X (Twitter)';
  return p[0].toUpperCase() + p.slice(1);
}

function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [ok, setOk] = React.useState(false);
  return (
    <button
      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#FFD9CF] hover:bg-[#FFF4F0] text-xs disabled:opacity-50"
      onClick={async () => {
        await navigator.clipboard.writeText(text || '');
        setOk(true);
        setTimeout(() => setOk(false), 900);
      }}
      disabled={!text}
      title={label}
    >
      {ok ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {ok ? 'Copiado' : label}
    </button>
  );
}

/* -------------------- helpers -------------------- */

function stripFences(s: string) {
  return String(s)
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
}

function buildInstagramCaption(v: any, keyword: string) {
  if (!v) return '';
  const parts = [
    (v.hook || '').trim(),
    (v.body || '').trim(),
    Array.isArray(v.cta_lines) ? v.cta_lines.join('\n').trim() : '',
    Array.isArray(v.hashtags) ? v.hashtags.join(' ').trim() : '',
  ].filter(Boolean);
  return parts.join('\n\n').replace(/\{keyword\}/gi, keyword);
}

function buildFacebookCaption(v: any) {
  if (!v) return '';
  const bullets =
    Array.isArray(v.bullets) && v.bullets.length
      ? v.bullets.map((b: string) => (b.startsWith('•') ? b : `• ${b}`)).join('\n').trim()
      : '';
  const parts = [
    (v.title || '').trim(),
    (v.intro || '').trim(),
    bullets,
    (v.cta || '').trim(),
    Array.isArray(v.hashtags) ? v.hashtags.join(' ').trim() : '',
  ].filter(Boolean);
  return parts.join('\n\n');
}

/** Deriva ID Shopee a partir da URL (shopId_itemId) */
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

/** Normaliza/garante product completo antes de enviar ao backend */
function ensureSafeProduct(baseUrl: string, p?: Product | null): Product {
  const id =
    (p?.id && String(p.id)) ||
    deriveShopeeIdFromUrl(p?.url || baseUrl) ||
    deriveShopeeIdFromUrl(baseUrl);

  return {
    id: id || '_',
    title: p?.title ?? '',
    price:
      p?.price == null
        ? null
        : typeof p.price === 'number'
        ? p.price
        : Number(p.price as any),
    rating:
      p?.rating == null
        ? null
        : typeof p.rating === 'number'
        ? p.rating
        : Number(p.rating as any),
    image: p?.image ?? '',
    url: p?.url ?? baseUrl,
  };
}

/* ---- chamadas backend ---- */

/** Link com SubIDs (n8n /webhook/shopee_subids via nosso proxy) */
async function getTrackedUrl(baseUrl: string, platform: PlatformKey, product?: Product) {
  const safeProduct = ensureSafeProduct(baseUrl, product);
  const r = await fetch('/api/integrations/shopee/subids', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base_url: baseUrl, platform, product: safeProduct }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || 'Falha ao montar SubIDs');
  return { url: (j.url as string) || '' };
}

/** Gera legenda (n8n /webhook/caption via /api/caption) */
async function fetchCaption(kind: 'instagram_caption' | 'facebook_caption', payload: any) {
  const r = await fetch('/api/caption', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, ...payload }),
  });
  let text = await r.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    try {
      data = JSON.parse(stripFences(text));
    } catch {
      data = { raw: text };
    }
  }
  if (!r.ok || data?.error) {
    throw new Error(data?.message || data?.error || `Falha ao gerar legenda`);
  }
  const root = Array.isArray(data) ? data[0] : data;
  const variants = root?.variants ?? data?.variants ?? [];
  const keyword = root?.keyword ?? payload?.keyword ?? 'oferta';
  return { variants, keyword };
}

/** Publica nas redes: envia TUDO que o webhook precisa + legenda */
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
  const safeProduct = ensureSafeProduct(product.url, product);

  // payload que vai para o n8n webhook social (via nosso proxy server-side)
  const payload = {
    platform,                   // 'facebook' | 'instagram' | 'x'
    caption,                    // legenda final
    shortlink: trackedUrl,      // link curto com subid embutido
    base_url: safeProduct.url,  // url canônica do produto
    product: safeProduct,       // produto normalizado
    scheduleTime: scheduleTime || null,
    source: 'dashboard_composer',
    meta: {
      generatedAt: new Date().toISOString(),
      platform_subid: platform, // subid == plataforma (conforme workflow)
    },
  };

  // 1) via API interna (recomendado p/ evitar CORS no client)
  const r = await fetch('/api/integrations/n8n/social', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  // // 2) se quiser bater direto no webhook do n8n, use isso (atenção ao CORS no client!):
  // const r = await fetch('https://n8n.seureview.com.br/webhook/social', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json', 'x-api-key': '<SEU_TOKEN_AQUI_OPCIONAL>' },
  //   body: JSON.stringify(payload),
  // });

  const j = await r.json().catch(() => ({}));
  if (!r.ok || j?.error) throw new Error(j?.error || 'Falha ao publicar nas redes sociais');
}

/* -------------------- componente -------------------- */

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
  const [busyLink, setBusyLink] = React.useState(false);
  const [busyCaption, setBusyCaption] = React.useState(false);
  const [errMsg, setErrMsg] = React.useState<string | null>(null);

  // gera link com SubIDs quando abre/muda plataforma
  React.useEffect(() => {
    if (!open || !product) return;
    let alive = true;
    (async () => {
      setBusyLink(true);
      setErrMsg(null);
      try {
        const { url } = await getTrackedUrl(product.url, platform, product);
        if (!alive) return;
        setTrackedUrl(url);
      } catch (e: any) {
        if (!alive) return;
        setTrackedUrl('');
        setErrMsg(e?.message || 'Falha ao gerar link com SubIDs');
      } finally {
        if (alive) setBusyLink(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, product, platform]);

  async function handleGenerateCaption() {
    if (!product) return;
    setBusyCaption(true);
    setErrMsg(null);
    try {
      const safeProduct = ensureSafeProduct(product.url, product);

      if (platform === 'instagram') {
        const { variants, keyword } = await fetchCaption('instagram_caption', {
          products: [safeProduct],
          keyword: 'oferta',
          style: 'Minimal',
        });
        const v = Array.isArray(variants) && variants.length ? variants[0] : null;
        setCaption(v ? buildInstagramCaption(v, keyword) : `${safeProduct.title}\n\nConfira aqui 👉 ${trackedUrl || safeProduct.url}`);
      } else {
        const { variants } = await fetchCaption('facebook_caption', {
          products: [safeProduct],
          style: 'Minimal',
        });
        const v = Array.isArray(variants) && variants.length ? variants[0] : null;
        setCaption(v ? buildFacebookCaption(v) : `${safeProduct.title}\n\nConfira aqui 👉 ${trackedUrl || safeProduct.url}`);
      }
    } catch (e: any) {
      const safeProduct = ensureSafeProduct(product.url, product);
      setCaption(`${safeProduct.title}\n\nConfira aqui 👉 ${trackedUrl || safeProduct.url}`);
      setErrMsg(e?.message || 'Falha ao gerar legenda');
    } finally {
      setBusyCaption(false);
    }
  }

  async function publishNow(scheduleTime?: string) {
    if (!product) return;
    if (!trackedUrl) {
      alert('Gerando link… aguarde e tente novamente.');
      return;
    }
    const safeProduct = ensureSafeProduct(product.url, product);
    const finalCaption = (caption || `${safeProduct.title}\n\nConfira aqui 👉 ${trackedUrl}`).trim();
    try {
      await publishToSocial({ platform, product: safeProduct, trackedUrl, caption: finalCaption, scheduleTime });
      alert(scheduleTime ? 'Publicação agendada com sucesso!' : 'Publicado com sucesso!');
      onClose();
    } catch (err: any) {
      setErrMsg(err?.message || 'Erro ao publicar nas redes sociais');
    }
  }

  if (!open || !product) return null;

  const publishDisabled = !trackedUrl || busyLink || busyCaption;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white border-l shadow-xl flex flex-col">
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
              <div className="text-sm text-gray-600">
                {product.price != null ? `R$ ${Number(product.price).toFixed(2)}` : 'Preço: —'}
              </div>
              <div className="text-xs text-gray-500">
                ID: {product.id || deriveShopeeIdFromUrl(product.url)}
              </div>
            </div>
          </div>

          {/* Erro */}
          {errMsg && (
            <div className="p-2 text-xs rounded-md border border-[#FFD9CF] bg-[#FFF4F0] text-[#B42318]">
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
                    platform === p ? 'bg-[#EE4D2D] text-white border-[#EE4D2D]' : 'bg-white border-[#FFD9CF] hover:bg-[#FFF4F0]'
                  )}
                  disabled={busyLink || busyCaption}
                >
                  {platformLabel(p)}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#6B7280] mt-1">
              Ao trocar a plataforma, o link rastreável é atualizado. A legenda só é gerada quando você clicar no botão abaixo.
            </p>
          </div>

          {/* Ações de geração */}
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-[#374151]">
              Legenda {busyCaption && <span className="ml-2 text-[11px] text-[#EE4D2D]">gerando…</span>}
            </div>
            <button
              onClick={handleGenerateCaption}
              disabled={busyCaption}
              className={cx(
                'inline-flex items-center gap-1.5 rounded-md text-xs px-3 py-1.5 border',
                'border-[#FFD9CF] bg-white hover:bg-[#FFF4F0] text-[#1F2937]',
                busyCaption && 'opacity-60 cursor-not-allowed'
              )}
              title="Gerar legenda com IA"
            >
              {busyCaption ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              {busyCaption ? 'Gerando…' : 'Gerar legenda'}
            </button>
          </div>

          {/* Campo legenda */}
          <textarea
            className="w-full border border-[#FFD9CF] rounded-lg p-2 text-sm"
            rows={10}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={
              busyCaption
                ? 'Gerando legenda…'
                : platform === 'instagram'
                ? 'Clique em “Gerar legenda” para uma versão com hook + body + CTAs + hashtags.'
                : 'Clique em “Gerar legenda” para título + intro + bullets + CTA + hashtags.'
            }
          />

          {/* Link + utilidades */}
          <div className="flex items-center justify-between">
            <div className="text-[11px] text-[#6B7280] flex items-center gap-2">
              <LinkIcon className="w-3.5 h-3.5" />
              {busyLink ? 'Gerando link com SubIDs…' : trackedUrl ? 'Link com SubIDs pronto.' : 'Sem link ainda.'}
            </div>
            <div className="flex items-center gap-2">
              <CopyButton text={trackedUrl} label="Copiar link" />
              <CopyButton text={caption} label="Copiar legenda" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-2">
          <button className="px-4 py-2 rounded-lg border border-[#FFD9CF] hover:bg-[#FFF4F0]" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="px-3.5 py-2 rounded-lg bg-[#EE4D2D] hover:bg-[#D8431F] text-white flex items-center gap-2 text-sm disabled:opacity-60"
            disabled={publishDisabled}
            onClick={() => publishNow()}
            title={`Postar no ${platformLabel(platform)}`}
          >
            {busyLink || busyCaption ? <Loader2 className="animate-spin w-4 h-4" /> : null}
            Postar no {platformLabel(platform)}
          </button>
          <button
            className="px-3.5 py-2 rounded-lg bg-[#111827] hover:bg-[#1f2937] text-white flex items-center gap-2 text-sm disabled:opacity-60"
            disabled={publishDisabled}
            onClick={() => {
              const when = prompt('Agendar para (ex: 2025-10-05T18:00:00Z):');
              if (when) publishNow(when);
            }}
            title="Agendar publicação"
          >
            <CalendarClock className="w-4 h-4" />
            Agendar…
          </button>
        </div>
      </aside>
    </div>
  );
}
