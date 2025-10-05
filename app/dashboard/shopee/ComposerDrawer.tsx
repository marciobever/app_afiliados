'use client';

import React from 'react';
import {
  X as XIcon,
  Copy,
  Check,
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

/** ---- API helpers ---- */

/** Gera legenda via seu endpoint de caption (n8n por trás). */
async function fetchCaption(kind: 'instagram_caption' | 'facebook_caption', product: Product) {
  const res = await fetch('/api/caption', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind,
      products: [
        {
          id: product.id,
          title: product.title,
          price: product.price,
          rating: product.rating,
          url: product.url,
        },
      ],
      keyword: 'oferta', // você pode trocar depois por campo opcional
      style: 'Minimal',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Falha ao gerar legenda');
  return data as any; // { platform, keyword?, variants? } ou { caption? }
}

/** Gera link com SubIDs (não exibimos na UI, só guardamos pra publicar). */
async function getTrackedUrl(baseUrl: string, platform: PlatformKey, product: Product) {
  const r = await fetch('/api/integrations/shopee/subids', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      base_url: baseUrl,
      platform,
      sub_profile: '', // sem perfis por enquanto
      product,
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || 'Falha ao montar SubIDs');
  return {
    url: (j.url as string) || '',
    subids: (j.subids_used as string[]) || [],
  };
}

/** Publica nas redes via webhook /webhook/social (proxy interno). */
async function publishToSocial(args: {
  platform: PlatformKey;
  product: Product;
  trackedUrl: string;
  caption: string;
  scheduleTime?: string | null;
}) {
  const r = await fetch('/api/integrations/n8n/social', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j?.error) throw new Error(j?.error || 'Falha ao publicar');
}

/** ---- caption builders ---- */

function buildInstagramCaptionFromVariants(payload: any, link?: string) {
  // payload esperado: { keyword, variants: [{hook, body, cta_lines, hashtags}] }
  try {
    const v = Array.isArray(payload?.variants) ? payload.variants[0] : null;
    if (!v) return '';
    const parts = [
      v.hook?.trim(),
      v.body?.trim(),
      (Array.isArray(v.cta_lines) ? v.cta_lines : []).map((l: string) => l?.trim()).filter(Boolean).join('\n'),
      (Array.isArray(v.hashtags) ? v.hashtags : []).map((h: string) => h?.trim()).filter(Boolean).join(' '),
      link ? `\nConfira aqui 👉 ${link}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');
    return parts.trim();
  } catch {
    return '';
  }
}

function buildFacebookCaptionFromVariants(payload: any, link?: string) {
  // payload esperado: { variants: [{ title, intro, bullets[], cta, hashtags[] }] }
  try {
    const v = Array.isArray(payload?.variants) ? payload.variants[0] : null;
    if (!v) return '';
    const bulletsBlock = Array.isArray(v.bullets)
      ? v.bullets
          .map((b: string) => b?.trim())
          .filter(Boolean)
          .map((b: string) => (b.startsWith('•') ? b : `• ${b}`))
          .join('\n')
      : '';
    const hashtagsBlock = Array.isArray(v.hashtags) ? v.hashtags.map((h: string) => h?.trim()).join(' ') : '';
    const parts = [v.title?.trim(), v.intro?.trim(), bulletsBlock, v.cta?.trim(), hashtagsBlock, link ? `\n${link}` : '']
      .filter(Boolean)
      .join('\n\n');
    return parts.trim();
  } catch {
    return '';
  }
}

/** ---- Componente ---- */

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

  // estados de geração/publicação
  const [caption, setCaption] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // link rastreável guardado (invisível na UI)
  const [trackedUrl, setTrackedUrl] = React.useState('');
  const [subidsUsed, setSubidsUsed] = React.useState<string[]>([]);

  // sempre que trocar de plataforma ou abrir com novo produto, limpamos estado
  React.useEffect(() => {
    if (!open) return;
    setCaption('');
    setTrackedUrl('');
    setSubidsUsed([]);
    setStatus('Selecione a plataforma e clique em “Gerar legenda”.');
    setError(null);
  }, [open, platform, product?.id]);

  async function handleGenerate() {
    if (!product) return;
    setLoading(true);
    setError(null);
    setStatus('Gerando link rastreável…');

    try {
      // 1) gera link com subids (sem mostrar)
      const { url, subids } = await getTrackedUrl(product.url, platform, product);
      setTrackedUrl(url);
      setSubidsUsed(subids || []);

      // 2) gera legenda
      setStatus('Gerando legenda…');
      const kind: 'instagram_caption' | 'facebook_caption' =
        platform === 'instagram' ? 'instagram_caption' : 'facebook_caption';
      const data = await fetchCaption(kind, product);

      // 3) monta texto no formato certo
      let text = '';
      if (platform === 'instagram') {
        text = buildInstagramCaptionFromVariants(data, url || product.url);
      } else {
        text = buildFacebookCaptionFromVariants(data, url || product.url);
      }
      if (!text) {
        // fallback simples
        text = `${product.title}\n\nConfira aqui 👉 ${url || product.url}`;
      }

      setCaption(text);
      setStatus(null);
    } catch (e: any) {
      setError(e?.message || 'Falha ao gerar');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  async function publishNow(scheduleTime?: string) {
    if (!product) return;
    if (!trackedUrl) {
      setError('Gere a legenda primeiro (o link rastreável é criado junto).');
      return;
    }
    setLoading(true);
    setError(null);
    setStatus(scheduleTime ? 'Agendando publicação…' : 'Publicando…');
    try {
      const finalCaption = caption?.trim() || `${product.title}\n\n${trackedUrl}`;
      await publishToSocial({
        platform,
        product,
        trackedUrl,
        caption: finalCaption,
        scheduleTime: scheduleTime || null,
      });
      setStatus(null);
      alert(scheduleTime ? 'Publicação agendada com sucesso!' : 'Publicado com sucesso!');
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Falha ao publicar');
      setStatus(null);
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
              Ao clicar em <b>Gerar legenda</b>, criamos o link rastreável e a legenda desta plataforma.
            </p>
          </div>

          {/* Botão Gerar legenda */}
          <div className="pt-1">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#EE4D2D] hover:bg-[#D8431F] text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Gerar legenda
            </button>
          </div>

          {/* Status/Erro */}
          {(status || error) && (
            <div
              className={cx(
                'text-sm rounded-md border p-2',
                error ? 'text-[#B42318] border-[#FFD9CF] bg-[#FFF4F0]' : 'text-[#374151] border-[#E5E7EB] bg-[#F9FAFB]'
              )}
            >
              {error || status}
            </div>
          )}

          {/* Legenda (editável) */}
          <div>
            <label className="text-sm font-medium text-[#374151]">Legenda</label>
            <div className="mt-1 border border-[#FFD9CF] rounded-lg">
              <textarea
                className="w-full rounded-lg p-3 text-sm outline-none min-h-[200px]"
                placeholder={loading ? 'Gerando…' : 'Clique em “Gerar legenda” ou edite livremente.'}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
              <div className="flex items-center justify-between p-2 border-t border-[#FFD9CF] bg-[#FFF8F6] rounded-b-lg">
                <span className="text-xs text-[#6B7280]">
                  Dica: você pode editar a legenda antes de publicar.
                </span>
                <CopyButton text={caption} label="Copiar" />
              </div>
            </div>
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
