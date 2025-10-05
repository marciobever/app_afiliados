'use client';

import React from 'react';
import { X as XIcon, Loader2, CalendarClock } from 'lucide-react';

type PlatformKey = 'facebook' | 'instagram' | 'x';

type SubProfile = {
  key: string;         // ex: "mina", "receita", "trends"
  label: string;       // ex: "Mina", "Receita", "Trends"
  hint?: string;       // opcional para tooltip/descrição
};

function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(' ');
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

/** Busca a lista de perfis de SubIDs que o usuário configurou */
async function fetchSubProfiles(): Promise<SubProfile[]> {
  const r = await fetch('/api/subids/profiles', { method: 'GET', cache: 'no-store' });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || 'Falha ao carregar perfis de SubIDs');
  return (j.profiles as SubProfile[]) || [];
}

/** Cria link com SubIDs com base no perfil escolhido */
async function getTrackedUrl(baseUrl: string, platform: PlatformKey, subProfileKey: string, product: any) {
  const r = await fetch('/api/integrations/shopee/subids', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      base_url: baseUrl,
      platform,
      sub_profile: subProfileKey, // <<< PERFIL ESCOLHIDO
      product,                    // opcional: útil p/ montar sub3=sub_item etc
    }),
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
  const [caption, setCaption] = React.useState('');
  const [trackedUrl, setTrackedUrl] = React.useState('');
  const [subidsUsed, setSubidsUsed] = React.useState<string[]>([]);
  const [profiles, setProfiles] = React.useState<SubProfile[]>([]);
  const [activeProfile, setActiveProfile] = React.useState<string>(''); // key selecionada
  const [loading, setLoading] = React.useState(false);
  const [linkLoading, setLinkLoading] = React.useState<string>(''); // key em carregamento

  // 1) Carrega perfis + gera caption (link só quando clicar numa Sub)
  React.useEffect(() => {
    if (!open || !product) return;
    let cancel = false;

    async function init() {
      setLoading(true);
      try {
        const [pf, cap] = await Promise.all([
          fetchSubProfiles(),
          generateCaption(product.title, platform),
        ]);
        if (cancel) return;

        setProfiles(pf);
        setCaption(cap.replace('{link}', '')); // sem link por enquanto
        setTrackedUrl('');
        setSubidsUsed([]);
        setActiveProfile(''); // ainda não escolhido
      } catch (e) {
        // fallback
        setCaption(`${product.title}\n\nConfira aqui 👉 `);
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    init();
    return () => { cancel = true; };
  }, [open, product, platform]);

  // 2) Ao escolher um perfil, gera o link
  async function pickProfile(key: string) {
    if (!product) return;
    setActiveProfile(key);
    setLinkLoading(key);
    try {
      const { url, subids } = await getTrackedUrl(product.url, platform, key, product);
      setTrackedUrl(url);
      setSubidsUsed(subids);
      // injeta o link na legenda, preservando edição manual
      setCaption(prev => {
        if (!prev) return `${product.title}\n\nConfira aqui 👉 ${url}`;
        // se já tem um {link}, substitui; se não, tenta anexar
        if (prev.includes('{link}')) return prev.replace(/\{link\}/g, url);
        if (prev.trim().endsWith('👉')) return `${prev} ${url}`;
        return prev.includes('http') ? prev : `${prev}\n\n${url}`;
      });
    } catch (e: any) {
      alert(e?.message || 'Erro ao gerar link para o perfil');
    } finally {
      setLinkLoading('');
    }
  }

  async function publishNow(scheduleTime?: string) {
    if (!product) return;
    if (!trackedUrl) {
      alert('Escolha uma Sub primeiro para gerar o link rastreado.');
      return;
    }
    const finalCaption = caption.replace(/\{link\}/g, trackedUrl);

    let iso: string | null = null;
    if (scheduleTime) {
      const d = new Date(scheduleTime);
      if (isNaN(d.getTime())) {
        alert('Data inválida. Use algo como 2025-10-05T18:00:00-03:00');
        return;
      }
      iso = d.toISOString();
    }

    const res = await fetch('/api/integrations/n8n/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform,
        product,
        trackedUrl,
        subidsUsed,
        caption: finalCaption,
        scheduleTime: iso,
        sub_profile: activeProfile || null,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Publish error:', err);
      alert('Falha ao publicar: ' + (err?.error || res.status));
      return;
    }

    alert(iso ? 'Publicação agendada!' : 'Publicado com sucesso!');
    onClose();
  }

  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[560px] bg-white border-l shadow-xl flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-semibold">Composer</div>
          <button className="p-2 rounded hover:bg-[#FFF4F0]" onClick={onClose}>
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
            <p className="text-xs text-[#6B7280] mt-1">
              Escolha uma Sub abaixo para gerar o link rastreado desta plataforma.
            </p>
          </div>

          {/* Subs (perfis) */}
          <div>
            <label className="text-sm font-medium text-[#374151]">Subs (Perfis)</label>
            {loading ? (
              <div className="mt-2 text-sm text-[#6B7280] flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Carregando perfis…
              </div>
            ) : profiles.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {profiles.map((pf) => (
                  <button
                    key={pf.key}
                    onClick={() => pickProfile(pf.key)}
                    className={cx(
                      'px-3 py-1.5 rounded-lg border text-sm',
                      activeProfile === pf.key
                        ? 'bg-[#EE4D2D] text-white border-[#EE4D2D]'
                        : 'bg-white border-[#FFD9CF] hover:bg-[#FFF4F0]'
                    )}
                    title={pf.hint || ''}
                    disabled={!!linkLoading && linkLoading !== pf.key}
                  >
                    {linkLoading === pf.key ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> {pf.label}
                      </span>
                    ) : (
                      pf.label
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-sm text-[#6B7280]">
                Nenhuma Sub encontrada. Cadastre no painel de SubIDs.
              </p>
            )}
          </div>

          {/* Link gerado */}
          <div>
            <label className="text-sm font-medium text-[#374151]">Link rastreado</label>
            <input
              className="mt-1 w-full border border-[#FFD9CF] rounded px-3 py-2 text-sm"
              value={trackedUrl}
              readOnly
              placeholder="Clique numa Sub para gerar"
            />
            {!!subidsUsed.length && (
              <p className="mt-1 text-xs text-[#6B7280]">
                SubIDs: {subidsUsed.join(' · ')}
              </p>
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
              placeholder={loading ? 'Gerando…' : 'Edite se quiser antes de publicar'}
            />
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
            className="px-4 py-2 rounded-lg bg-[#EE4D2D] hover:bg-[#D8431F] text-white flex items-center gap-2 disabled:opacity-60"
            disabled={!trackedUrl || !caption}
            onClick={() => publishNow()}
          >
            Publicar
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#1f2937] text-white flex items-center gap-2 disabled:opacity-60"
            disabled={!trackedUrl || !caption}
            onClick={() => {
              const when = prompt('Agendar (ex: 2025-10-05T18:00:00-03:00):');
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
