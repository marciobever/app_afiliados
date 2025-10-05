'use client';

import React from 'react';
import {
  X as XIcon,
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

/* --------- helpers --------- */

/** Monta a legenda quando o n8n devolve { variants: [...] } (payload que você mostrou) */
function buildCaptionFromVariants(variants: any[], platform: PlatformKey) {
  if (!Array.isArray(variants) || variants.length === 0) return '';
  const v = variants[0] || {};
  const hook = (v.hook || '').toString().trim();
  const body = (v.body || '').toString().trim();
  const ctas = Array.isArray(v.cta_lines) ? v.cta_lines.map((l: any) => (l || '').toString().trim()).filter(Boolean) : [];
  const hashtags = Array.isArray(v.hashtags) ? v.hashtags.map((h: any) => (h || '').toString().trim()).filter(Boolean) : [];

  const blocks = [
    hook,
    body,
    ctas.join('\n'),
    hashtags.join(' '),
  ].filter(Boolean);

  let txt = blocks.join('\n\n').trim();

  // Para Facebook, geralmente queremos o link explícito no corpo.
  // Se o modelo vier sem {link}, deixamos o publish() injetar no fim.
  // Se vier com {link}, será substituído lá.
  if (platform === 'facebook' && !/\{link\}/i.test(txt)) {
    txt = `${txt}\n\n{link}`;
  }

  return txt;
}

/** IA de legendas por plataforma via /api/caption (fallback /api/ai/gemini-caption) */
async function generateCaption(title: string, platform: PlatformKey) {
  const kind =
    platform === 'instagram' ? 'instagram_caption'
    : platform === 'facebook' ? 'facebook_caption'
    : 'facebook_caption';

  const r = await fetch('/api/caption', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // products só precisa de título; o n8n já sabe montar CTA por plataforma
    body: JSON.stringify({ kind, products: [{ title }], style: 'Default', keyword: 'oferta' }),
  });

  const j = await r.json().catch(() => ({}));
  if (r.ok && !j?.error) {
    // pode vir { caption } OU { variants: [...] }
    if (j?.caption) return String(j.caption || '');
    const variants = Array.isArray(j?.variants) ? j.variants : Array.isArray(j?.[0]?.variants) ? j[0].variants : null;
    if (variants) return buildCaptionFromVariants(variants, platform);
  }

  // fallback gemini
  const r2 = await fetch('/api/ai/gemini-caption', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, platform }),
  });
  const j2 = await r2.json().catch(() => ({}));
  if (!r2.ok || j2?.error) throw new Error(j?.error || j2?.error || 'Falha ao gerar legenda');
  return String(j2.caption || '');
}

/** Link rastreável (n8n /webhook/shopee_subids via proxy) — não exibimos mais na UI */
async function getTrackedUrl(baseUrl: string, platform: PlatformKey, product: Product) {
  const r = await fetch('/api/integrations/shopee/subids', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      base_url: baseUrl,
      platform,
      product, // importante para montar subIds (item_id etc.)
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j?.error) throw new Error(j?.error || 'Falha ao montar SubIDs');
  return (j.url as string) || '';
}

/** Publica nas redes (n8n /webhook/social via proxy) */
async function publishToSocial(args: {
  platform: PlatformKey;
  product: Product;
  trackedUrl: string;
  caption: string;
  scheduleTime?: string;
}) {
  const r = await fetch('/api/integrations/n8n/social', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...args, scheduleTime: args.scheduleTime ?? null }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j?.error) throw new Error(j?.error || 'Falha ao publicar nas redes sociais');
}

/* --------- componente --------- */

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
  const [caption, setCaption] = React.useState('');
  const [trackedUrl, setTrackedUrl] = React.useState(''); // interno
  const [loading, setLoading] = React.useState(false);
  const [errMsg, setErrMsg] = React.useState<string | null>(null);

  // Recarrega tudo sempre que abrir / trocar plataforma / trocar produto
  React.useEffect(() => {
    if (!open || !product) return;

    let cancel = false;
    async function load() {
      setLoading(true);
      setErrMsg(null);
      setCaption('');
      setTrackedUrl('');

      try {
        const [url, cap] = await Promise.all([
          getTrackedUrl(product.url, platform, product),
          generateCaption(product.title, platform),
        ]);
        if (cancel) return;

        setTrackedUrl(url || '');
        // injeta {link} se houver; caso contrário, se a plataforma for Facebook,
        // adiciona o link no final na hora do publish.
        const ready = (cap || '').replace(/\{link\}/gi, url || product.url);
        setCaption(ready || `${product.title}\n\nConfira aqui 👉 ${url || product.url}`);
      } catch (e: any) {
        if (cancel) return;
        setErrMsg(e?.message || 'Falha ao preparar link/legenda');
        // fallback mínimo
        setCaption(`${product.title}\n\nConfira aqui 👉 ${product.url}`);
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    load();

    return () => {
      cancel = true;
    };
  }, [open, product, platform]);

  async function publishNow(scheduleTime?: string) {
    if (!product) return;
    // se a legenda ainda tiver {link}, substitui agora
    let finalCaption = caption.replace(/\{link\}/gi, trackedUrl || product.url).trim();

    // Para Facebook, se não há {link} na legenda, garante o link no final
    if (platform === 'facebook' && !finalCaption.includes(trackedUrl)) {
      finalCaption = `${finalCaption}\n\n${trackedUrl || product.url}`.trim();
    }

    setLoading(true);
    setErrMsg(null);
    try {
      await publishToSocial({ platform, product, trackedUrl: trackedUrl || product.url, caption: finalCaption, scheduleTime });
      alert(scheduleTime ? 'Publicação agendada com sucesso!' : 'Publicado com sucesso!');
      onClose();
    } catch (err: any) {
      setErrMsg(err?.message || 'Erro ao publicar nas redes sociais');
    } finally {
      setLoading(false);
    }
  }

  if (!open || !product) return null;

  const publishDisabled = loading || !caption;

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

          {/* Estado */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#374151]">Plataforma</span>
            {loading && (
              <span className="inline-flex items-center gap-1 text-xs text-[#6B7280]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando link e legenda…
              </span>
            )}
          </div>

          {/* Botões de plataforma */}
          <div className="mt-1 flex gap-2">
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

          {/* Erro */}
          {errMsg && (
            <div className="p-2 text-sm rounded-md border border-[#FFD9CF] bg-[#FFF4F0] text-[#B42318]">
              {errMsg}
            </div>
          )}

          {/* Legenda (sempre editável) */}
          <div>
            <label className="text-sm font-medium text-[#374151]">Legenda</label>
            <textarea
              className="mt-1 w-full border border-[#FFD9CF] rounded-lg p-2 text-sm"
              rows={10}
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
            disabled={loading}
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
