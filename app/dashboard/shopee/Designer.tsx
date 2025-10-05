'use client';

import React from 'react';
import { Instagram, Wand2, ImageIcon } from 'lucide-react';
import FeedMock from '@/components/FeedMock';
import { buildInstagramCaption } from '@/utils/captions';

function Separator() {
  return <div className="h-px w-full bg-[#FFD9CF]" />;
}

export default function Designer({
  selected,
  productsMap,
}: {
  selected: string[];
  productsMap: Record<string, any>;
}) {
  const [style, setStyle] = React.useState<'Minimal' | 'Promo' | 'Dark' | 'Vibrante' | 'Clean'>('Minimal');
  const [igKeyword, setIgKeyword] = React.useState('oferta');

  const [igVariants, setIgVariants] = React.useState<
    { hook: string; body: string; cta_lines: string[]; hashtags: string[] }[]
  >([]);
  const [igIndex, setIgIndex] = React.useState(0);

  const [fbVariants, setFbVariants] = React.useState<
    { title: string; intro: string; bullets: string[]; cta: string; hashtags: string[] }[]
  >([]);
  const [fbIndex, setFbIndex] = React.useState(0);

  const [genErr, setGenErr] = React.useState<string | null>(null);
  const [genLoading, setGenLoading] = React.useState<null | 'ig' | 'fb' | 'mock'>(null);

  const picked = React.useMemo(
    () => selected.slice(0, 8).map((id) => productsMap[id]).filter(Boolean),
    [selected, productsMap]
  );

  function compactProducts() {
    return picked.slice(0, 8).map((p: any) => ({
      id: String(p.id),
      title: p.title,
      price: Number(p.price ?? 0),
      rating: Number(p.rating ?? 0),
      url: p.url,
      image: p.image,
    }));
  }

  async function callCaption(kind: 'instagram_caption' | 'facebook_caption', extra: any = {}) {
    const res = await fetch('/api/caption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, style, products: compactProducts(), ...extra }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Falha na geração');
    return data;
  }

  async function generateInstagramCaption() {
    if (!picked.length) {
      setGenErr('Selecione pelo menos 1 produto.');
      return;
    }
    setGenErr(null);
    setGenLoading('ig');
    try {
      const data = await callCaption('instagram_caption', { keyword: igKeyword });
      const variants = Array.isArray(data) ? data?.[0]?.variants : data?.variants;
      if (!Array.isArray(variants)) throw new Error('Resposta inválida do n8n (variants)');
      setIgVariants(variants);
      setIgIndex(0);
    } catch (e: any) {
      setGenErr(e?.message || 'Erro ao gerar caption do Instagram');
    } finally {
      setGenLoading(null);
    }
  }

  async function generateFacebookCaption() {
    if (!picked.length) {
      setGenErr('Selecione pelo menos 1 produto.');
      return;
    }
    setGenErr(null);
    setGenLoading('fb');
    try {
      const data = await callCaption('facebook_caption');
      const variants = Array.isArray(data) ? data?.[0]?.variants : data?.variants;
      if (!Array.isArray(variants)) throw new Error('Resposta inválida do n8n (variants)');
      setFbVariants(variants);
      setFbIndex(0);
    } catch (e: any) {
      setGenErr(e?.message || 'Erro ao gerar caption do Facebook');
    } finally {
      setGenLoading(null);
    }
  }

  const igCaptionText = React.useMemo(() => {
    if (!igVariants.length) return '';
    const v = igVariants[Math.max(0, Math.min(igIndex, igVariants.length - 1))];
    return buildInstagramCaption(v);
  }, [igVariants, igIndex]);

  const fbCaptionText = React.useMemo(() => {
    if (!fbVariants.length) return '';
    const v = fbVariants[Math.max(0, Math.min(fbIndex, fbVariants.length - 1))];
    const blocks = [
      v.title?.trim(),
      v.intro?.trim(),
      (v.bullets || []).map((b) => `• ${b}`).join('\n').trim(),
      v.cta?.trim(),
      (v.hashtags || []).join(' ').trim(),
    ]
      .filter(Boolean)
      .join('\n\n');
    return blocks;
  }, [fbVariants, fbIndex]);

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-[#FFD9CF] bg-white">
        <div className="p-4 border-b border-[#FFD9CF]">
          <h2 className="text-base font-semibold flex items-center gap-2 text-[#111827]">
            <Instagram className="w-5 h-5 text-[#EE4D2D]" /> Template de Post (Feed)
          </h2>
        </div>

        {genErr && (
          <div className="mx-4 mt-4 p-3 rounded-lg border border-[#FFD9CF] bg-[#FFF4F0] text-[#B42318] text-sm">
            {genErr}
          </div>
        )}

        <div className="p-4 grid lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {/* Seleção */}
            <label className="text-sm font-medium text-[#374151]">Seleção (Produtos)</label>
            <div className="flex flex-wrap gap-2">
              {picked.length ? (
                picked.map((sp: any) => (
                  <span
                    key={sp.id}
                    className="inline-flex items-center rounded-full border border-[#FFD9CF] px-2 py-0.5 text-xs bg-[#FFF4F0] text-[#EE4D2D]"
                  >
                    {sp.title.slice(0, 24)}…
                  </span>
                ))
              ) : (
                <span className="text-sm text-[#6B7280]">Nenhum produto selecionado (marque na aba Produtos)</span>
              )}
            </div>

            <Separator />

            {/* estilo */}
            <label className="text-sm font-medium text-[#374151]">Estilo</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Minimal', 'Promo', 'Dark', 'Vibrante', 'Clean'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={[
                    'px-3 py-1.5 border rounded-lg text-sm flex items-center gap-2 hover:bg-[#FFF4F0]',
                    'border-[#FFD9CF]',
                    style === s ? 'bg-[#FFF4F0]' : 'bg-white',
                  ].join(' ')}
                >
                  <Wand2 className="w-4 h-4 text-[#EE4D2D]" />
                  {s}
                </button>
              ))}
            </div>

            {/* Instagram */}
            <div className="mt-2 space-y-2">
              <label className="text-sm font-medium text-[#374151]">Instagram — palavra do comentário (CTA)</label>
              <div className="flex gap-2">
                <input
                  value={igKeyword}
                  onChange={(e) => setIgKeyword(e.target.value)}
                  className="border border-[#FFD9CF] rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D]"
                  placeholder='Ex.: oferta, QUERO, "link", cupom…'
                />
                <button
                  onClick={generateInstagramCaption}
                  disabled={genLoading === 'ig'}
                  className="px-4 py-2 rounded-lg bg-[#EE4D2D] hover:bg-[#D8431F] text-white whitespace-nowrap"
                >
                  {genLoading === 'ig' ? 'Gerando…' : 'Gerar IG'}
                </button>
              </div>

              {!!igVariants.length && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[#6B7280]">Variação:</span>
                  <select
                    value={igIndex}
                    onChange={(e) => setIgIndex(Number(e.target.value))}
                    className="border border-[#FFD9CF] rounded px-2 py-1"
                  >
                    {igVariants.map((_, i) => (
                      <option key={i} value={i}>
                        {i + 1} / {igVariants.length}
                      </option>
                    ))}
                  </select>
                  <button
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#FFD9CF] hover:bg-[#FFF4F0] text-sm"
                    onClick={async () => {
                      await navigator.clipboard.writeText(igCaptionText);
                    }}
                  >
                    Copiar
                  </button>
                </div>
              )}

              <textarea
                value={igCaptionText}
                onChange={() => {}}
                readOnly
                rows={Math.min(14, Math.max(6, igCaptionText.split('\n').length))}
                className="w-full border border-[#FFD9CF] rounded-lg p-2 focus:outline-none"
                placeholder={`Legenda Instagram com CTA "comente \"${igKeyword}\" que te envio o link!" — gere para preencher`}
              />
            </div>

            {/* Facebook */}
            <div className="mt-2 space-y-2">
              <label className="text-sm font-medium text-[#374151]">Facebook — legenda estruturada</label>
              <div className="flex gap-2">
                <button
                  onClick={generateFacebookCaption}
                  disabled={genLoading === 'fb'}
                  className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#272b33] text-white"
                >
                  {genLoading === 'fb' ? 'Gerando…' : 'Gerar Facebook'}
                </button>
                {!!fbVariants.length && (
                  <>
                    <span className="text-sm text-[#6B7280] self-center">Variação:</span>
                    <select
                      value={fbIndex}
                      onChange={(e) => setFbIndex(Number(e.target.value))}
                      className="border border-[#FFD9CF] rounded px-2 py-1"
                    >
                      {fbVariants.map((_, i) => (
                        <option key={i} value={i}>
                          {i + 1} / {fbVariants.length}
                        </option>
                      ))}
                    </select>
                    <button
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#FFD9CF] hover:bg-[#FFF4F0] text-sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(fbCaptionText);
                      }}
                    >
                      Copiar
                    </button>
                  </>
                )}
              </div>
              <textarea
                value={fbCaptionText}
                readOnly
                rows={Math.min(16, Math.max(8, fbCaptionText.split('\n').length))}
                className="w-full border border-[#FFD9CF] rounded-lg p-2 focus:outline-none"
                placeholder={`Legenda Facebook (título, intro, bullets, CTA, hashtags) — gere para preencher`}
              />
            </div>
          </div>

          {/* preview */}
          <div>
            <label className="text-sm font-medium text-[#374151]">Pré-visualização</label>
            <div className="aspect-square bg-[#FFF4F0] rounded-2xl border border-[#FFD9CF] mt-2 overflow-hidden">
              {picked.length ? (
                <FeedMock
                  style={style}
                  products={picked.slice(0, 4).map((p: any) => ({
                    id: String(p.id),
                    title: p.title,
                    price: Number(p.price ?? 0),
                    image: p.image,
                  }))}
                  caption={igVariants[igIndex]?.hook || ''}
                />
              ) : (
                <div className="grid place-items-center h-full text-center p-6">
                  <div>
                    <ImageIcon className="w-10 h-10 mx-auto mb-2 text-[#EE4D2D]" />
                    <p className="text-sm text-[#6B7280]">Selecione produtos na aba “Produtos”.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
