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

/** Gera legenda com CTA via Gemini (insta/facebook diferentes) */
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

/** Lista perfis de SubID */
async function fetchProfiles(): Promise<string[]> {
  const r = await fetch('/api/subids/profiles', { method: 'GET', cache: 'no-store' });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || 'Falha ao carregar perfis');
  return Array.isArray(j.profiles) ? j.profiles : [];
}

/** Gera link rastreado com SubIDs para um perfil e plataforma */
async function getTrackedUrl(baseUrl: string, platform: PlatformKey, sub_profile: string, product?: any) {
  const r = await fetch('/api/integrations/shopee/subids', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base_url: baseUrl, platform, sub_profile, product }),
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
  const [profiles, setProfiles] = React.useState<string[]>([]);
  const [activeProfile, setActiveProfile] = React.useState<string>('');
  const [trackedUrl, setTrackedUrl] = React.useState('');
  const [subidsUsed, setSubidsUsed] = React.useState<string[]>([]);
  const [caption, setCaption] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [linkLoading, setLinkLoading] = React.useState(false);

  // 1) abre → carrega perfis + gera caption
  React.useEffect(() => {
    async function init() {
      if (!product) return;
      setLoading(true);
      try {
        // Perfis
        const ps = await fetchProfiles();
        setProfiles(ps);
        const initial = ps[0] || 'default';
        setActiveProfile(initial);

        // Caption
        const generated = await generateCaption(product.title, platform);
        setCaption(generated.replace('{link}', '')); // sem link ainda
      } catch {
        setCaption(`${product.title}\n\nConfira aqui 👉 {link}`);
      } finally {
        setLoading(false);
      }
    }
    if (open && product) init();
  }, [open, product, platform]);

  // 2) ao escolher um perfil, gera o link para (platform, perfil)
  async function buildLinkForProfile(profile: string) {
    if (!product) return;
    setLinkLoading(true);
    try {
      const { url, subids } = await getTrackedUrl(product.url, platform, profile, product);
      setTrackedUrl(url);
      setSubidsUsed(subids);
      // injeta o link na legenda, se houver placeholder
      setCaption((old) => (old.includes('{link}') ? old.replace(/\{link\}/g, url) : `${old}\n\n${url}`));
    } finally {
      setLinkLoading(false);
    }
  }

  // Auto-gerar link quando o primeiro perfil chega
  React.useEffect(() => {
    if (!open || !product) return;
    if (activeProfile) buildLinkForProfile(activeProfile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile]);

  async function publishNow(scheduleTime?: string) {
    if (!product) return;
    const finalCaption = caption.replace(/\{link\}/g, trackedUrl || product.url);

    const r = await fetch('/api/integrations/n8n/publish', {
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
    const j = await r.json();
    if (!r.ok) {
      alert(`Erro ao publicar: ${j?.error || 'desconhecido'}`);
      return;
    }

    alert(scheduleTime ? 'Publicação agendada!' : 'Publicado com sucesso!');
    onClose();
  }

  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* panel */}
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[560px] bg-white border-l shadow-xl flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-semibold">Composer</div>
          <button className="p-2 rounded hover:bg-[#FFF4F0]" aria-label="Fechar" onClick={onClose}>
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-5 overflow-auto">
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
            <p className="text-xs text-[#6B7280] mt-1">A legenda é gerada conforme a plataforma.</p>
          </div>

          {/* Perfis de SubID */}
          <div>
            <label className="text-sm font-medium text-[#374151]">Perfil de SubIDs</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {profiles.map((p) => (
                <button
                  key={p}
                  onClick={() => setActiveProfile(p)}
                  className={cx(
                    'px-3 py-1.5 rounded-full border text-sm',
                    activeProfile === p
                      ? 'bg-[#EE4D2D] text-white border-[#EE4D2D]'
                      : 'bg-white border-[#FFD9CF] hover:bg-[#FFF4F0]'
                  )}
                >
                  {p}
                </button>
              ))}
              {!profiles.length && <span className="text-sm text-[#6B7280]">Nenhum perfil disponível.</span>}
            </div>
            {!!subidsUsed.length && (
              <div className="mt-2 text-xs text-[#6B7280] flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5" />
                Aplicados: {subidsUsed.join(' · ')}
              </div>
            )}
          </div>

          {/* Link com SubIDs */}
          <div>
            <label className="text-sm font-medium text-[#374151]">Link rastreado</label>
            <div className="mt-1 flex gap-2">
              <input className="w-full border border-[#FFD9CF] rounded px-3 py-2 text-sm" value={trackedUrl} readOnly />
              <CopyButton text={trackedUrl} label="Copiar" />
            </div>
            {linkLoading && (
              <div className="text-xs text-[#6B7280] mt-1 inline-flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Gerando link…
              </div>
            )}
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
            disabled={loading || linkLoading}
            onClick={() => publishNow()}
          >
            {loading && <Loader2 className="animate-spin w-4 h-4" />}
            Publicar
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#1f2937] text-white flex items-center gap-2"
            disabled={loading || linkLoading}
            onClick={() => {
              const when = prompt('Agendar para (ex: 2025-10-05T18:00:00-03:00):');
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
