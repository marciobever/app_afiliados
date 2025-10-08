// app/dashboard/shopee/ComposerDrawer/index.tsx
'use client';

import * as React from 'react';
import {
  X as XIcon,
  Loader2,
  Globe2,
  Wand2,
} from 'lucide-react';

import {
  PlatformKey,
  Product,
  cx,
  stripFences,
  ensureSafeProduct,
  IG_TEMPLATES,
  FB_TEMPLATES,
} from './utils';

import {
  SectionCard,
  ProductSummary,
  PlatformSelector,
  LinkBox,
  ScheduleBox,
  CaptionEditor,
} from './ui';

/* =======================================================
   Funções de backend (mesmas rotas do projeto)
   ======================================================= */

/** Monta shortlink com SubIDs via nosso proxy para o n8n */
async function getTrackedUrl(baseUrl: string, platform: PlatformKey, product?: Product) {
  const safeProduct = ensureSafeProduct(baseUrl, product);
  const r = await fetch('/api/integrations/shopee/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ base_url: baseUrl, platform, product: safeProduct }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || (j as any).error) {
    throw new Error((j as any).message || (j as any).error || 'Falha ao montar SubIDs');
  }
  return { url: ((j as any).url as string) || '' };
}

/** Gera legenda via IA (n8n /webhook/caption via /api/caption) */
async function fetchCaption(kind: 'instagram_caption' | 'facebook_caption', payload: any) {
  const r = await fetch('/api/caption', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/plain;q=0.9,*/*;q=0.8' },
    body: JSON.stringify({ kind, ...payload }),
  });
  const text = await r.text();
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
    throw new Error(data?.message || data?.error || 'Falha ao gerar legenda');
  }
  const root = Array.isArray(data) ? data[0] : data;
  const variants = root?.variants ?? data?.variants ?? [];
  const keyword = root?.keyword ?? payload?.keyword ?? 'oferta';
  return { variants, keyword };
}

/** Publica/agenda via nossa API Next (proxy para n8n). Enviamos `link` e `trackedUrl`. */
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

  const payload = {
    platform,
    product: safeProduct,
    link: trackedUrl,         // compat com workflow antigo
    trackedUrl,               // compat com mapeamento novo
    caption,
    scheduleTime: scheduleTime || null, // ISO UTC se agendado
  };

  const res = await fetch('/api/integrations/n8n/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/plain;q=0.9,*/*;q=0.8' },
    body: JSON.stringify(payload),
  });

  const raw = await res.text();
  let data: any = null;
  try { data = raw ? JSON.parse(raw) : null; } catch {}

  if (!res.ok || (data && data.error)) {
    const msg =
      (data && (data.message || data.error)) ||
      (raw && raw.slice(0, 500)) ||
      `Falha (${res.status}) ao publicar`;
    throw new Error(msg);
  }
  return data || { ok: true, raw };
}

/* =======================================================
   Helpers locais
   ======================================================= */

const pad = (n: number) => String(n).padStart(2, '0');
const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Converte "YYYY-MM-DDTHH:mm" interpretado como LOCAL para ISO UTC (Z) */
function localToIsoUtc(localDateTime: string) {
  // new Date('YYYY-MM-DDTHH:mm') é interpretado como horário local no browser
  const d = new Date(localDateTime);
  if (isNaN(d.getTime())) return '';
  return new Date(Date.UTC(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    d.getHours(),
    d.getMinutes(),
    0,
    0,
  )).toISOString();
}

/* =======================================================
   Componente principal
   ======================================================= */

export default function ComposerDrawer({
  open,
  onClose,
  product,
}: {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}) {
  // Bloqueia scroll do body ao abrir
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // SubIDs (mostramos qual está ativo)
  const [subids, setSubids] = React.useState<{ by_platform: Record<string, string>; default: string }>({
    by_platform: {},
    default: '',
  });

  // plataforma + keyword (IG)
  const [platform, setPlatform] = React.useState<PlatformKey>('facebook');
  const [igKeyword, setIgKeyword] = React.useState<string>('oferta');

  // caption & link
  const [trackedUrl, setTrackedUrl] = React.useState('');
  const [caption, setCaption] = React.useState('');
  const [busyLink, setBusyLink] = React.useState(false);
  const [busyCaption, setBusyCaption] = React.useState(false);
  const [errMsg, setErrMsg] = React.useState<string | null>(null);

  // templates
  const [igTemplateKey, setIgTemplateKey] = React.useState<string>(IG_TEMPLATES[0].key);
  const [fbTemplateKey, setFbTemplateKey] = React.useState<string>(FB_TEMPLATES[0].key);

  // agendamento (agora com data/hora separados)
  const [mode, setMode] = React.useState<'now' | 'schedule'>('now');

  const now = new Date();
  const plus15 = new Date(now.getTime() + 15 * 60 * 1000);

  const [date, setDate] = React.useState<string>(fmtDate(now));     // YYYY-MM-DD
  const [time, setTime] = React.useState<string>(fmtTime(plus15));  // HH:mm

  const minDate = fmtDate(now);                         // não permitir datas passadas
  const minTimeHint = fmtTime(new Date(now.getTime() + 60 * 1000)); // dica “min +1min”
  const tzLabel = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Horário local';

  // Carrega SubIDs quando abrir
  React.useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      try {
        const r = await fetch('/api/integrations/shopee/subids', { cache: 'no-store' });
        const j = await r.json().catch(() => ({}));
        if (!alive) return;
        const cfg = j?.subids || { by_platform: {}, default: '' };
        setSubids({
          by_platform: cfg.by_platform || {},
          default: cfg.default || '',
        });
      } catch {}
    })();
    return () => { alive = false; };
  }, [open]);

  // Gera shortlink sempre que abrir/mudar plataforma
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
    return () => { alive = false; };
  }, [open, product, platform]);

  // Aplicar modelo pronto (sem IA)
  function applyTemplate() {
    if (!product) return;
    const safeProduct = ensureSafeProduct(product.url, product);
    if (platform === 'instagram') {
      const tpl = IG_TEMPLATES.find(t => t.key === igTemplateKey) || IG_TEMPLATES[0];
      setCaption(tpl.build(safeProduct, trackedUrl || safeProduct.url, igKeyword));
    } else {
      const tpl = FB_TEMPLATES.find(t => t.key === fbTemplateKey) || FB_TEMPLATES[0];
      setCaption(tpl.build(safeProduct, trackedUrl || safeProduct.url));
    }
  }

  async function handleGenerateCaption() {
    if (!product) return;
    setBusyCaption(true);
    setErrMsg(null);
    try {
      const safeProduct = ensureSafeProduct(product.url, product);

      if (platform === 'instagram') {
        const { variants, keyword } = await fetchCaption('instagram_caption', {
          products: [safeProduct],
          keyword: igKeyword || 'oferta',
          style: 'Minimal',
        });
        const v = Array.isArray(variants) && variants.length ? variants[0] : null;
        const parts = v
          ? [
              (v.hook || '').trim(),
              (v.body || '').trim(),
              Array.isArray(v.cta_lines) ? v.cta_lines.join('\n').trim() : '',
              Array.isArray(v.hashtags) ? v.hashtags.join(' ').trim() : '',
            ].filter(Boolean)
          : [`${safeProduct.title}`, `Confira aqui 👉 ${trackedUrl || safeProduct.url}`];
        setCaption(parts.join('\n\n').replace(/\{keyword\}/gi, keyword));
      } else {
        const { variants } = await fetchCaption('facebook_caption', {
          products: [safeProduct],
          style: 'Minimal',
        });
        const v = Array.isArray(variants) && variants.length ? variants[0] : null;
        const bullets =
          v?.bullets?.length
            ? v.bullets.map((b: string) => (b.startsWith('•') ? b : `• ${b}`)).join('\n').trim()
            : '';
        const parts = v
          ? [(v.title || '').trim(), (v.intro || '').trim(), bullets, (v.cta || '').trim(), (v.hashtags || []).join(' ')]
              .filter(Boolean)
          : [`${safeProduct.title}`, `Confira aqui 👉 ${trackedUrl || safeProduct.url}`];
        setCaption(parts.join('\n\n'));
      }
    } catch (e: any) {
      const safeProduct = ensureSafeProduct(product?.url || '', product!);
      setCaption(`${safeProduct.title}\n\nConfira aqui 👉 ${trackedUrl || safeProduct.url}`);
      setErrMsg(e?.message || 'Falha ao gerar legenda');
    } finally {
      setBusyCaption(false);
    }
  }

  async function handleSubmit() {
    if (!product) return;
    if (!trackedUrl) {
      setErrMsg('Gerando link… aguarde e tente novamente.');
      return;
    }
    const safeProduct = ensureSafeProduct(product.url, product);
    const finalCaption = (caption || `${safeProduct.title}\n\nConfira aqui 👉 ${trackedUrl}`).trim();

    let scheduleIso: string | undefined = undefined;
    if (mode === 'schedule') {
      if (!date || !time) {
        setErrMsg('Escolha data e hora para agendar.');
        return;
      }
      const localCombined = `${date}T${time}`;
      const when = new Date(localCombined);                 // horário local
      const minWhen = new Date(Date.now() + 60 * 1000);     // mínimo +1min
      if (isNaN(when.getTime()) || when < minWhen) {
        setErrMsg('Escolha um horário no futuro (mínimo +1 minuto).');
        return;
      }
      scheduleIso = localToIsoUtc(localCombined);           // envia UTC ISO
    }

    try {
      const resp = await publishToSocial({
        platform,
        product: safeProduct,
        trackedUrl,
        caption: finalCaption,
        scheduleTime: scheduleIso,
      });
      console.log('publish response:', resp);
      alert(mode === 'schedule' ? 'Publicação agendada com sucesso!' : 'Publicado com sucesso!');
      onClose();
    } catch (err: any) {
      console.error('publish error:', err);
      setErrMsg(err?.message || 'Erro ao publicar nas redes sociais');
    }
  }

  if (!open || !product) return null;

  const publishDisabled = !trackedUrl || busyLink || busyCaption;
  const availablePlatforms: PlatformKey[] = (['facebook','instagram','x'] as PlatformKey[]);
  const activeSubId = subids.by_platform[platform] || subids.default || '';

  return (
    <div className="fixed inset-0 z-[9999] flex items-stretch justify-end" aria-modal="true" role="dialog">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />

      {/* drawer */}
      <aside className="relative h-full w-full md:w-[980px] bg-white border-l shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 px-4 md:px-6 py-3 border-b bg-white/90 backdrop-blur flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Globe2 className="w-4 h-4 text-[#EE4D2D]" />
            Composer
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block text-[11px] text-[#6B7280]">
              SubID ativo: <b>{activeSubId || '(padrão vazio)'}</b>
            </div>
            <PlatformSelector
              platforms={availablePlatforms}
              value={platform}
              onChange={setPlatform}
              disabled={busyLink || busyCaption}
              className="hidden md:flex"
            />
            <button className="p-2 rounded hover:bg-[#FFF4F0]" aria-label="Fechar" onClick={onClose}>
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-4 md:px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Esquerda */}
            <div className="space-y-4">
              <ProductSummary product={product} />

              {/* Plataforma (mobile) */}
              <SectionCard className="lg:hidden space-y-2">
                <div className="text-sm font-medium">Plataforma</div>
                <PlatformSelector
                  platforms={availablePlatforms}
                  value={platform}
                  onChange={setPlatform}
                  disabled={busyLink || busyCaption}
                />
                <p className="text-[11px] text-[#6B7280]">
                  SubID ativo: <span className="font-medium">{activeSubId || '(padrão vazio)'}</span>
                </p>
              </SectionCard>

              <LinkBox trackedUrl={trackedUrl} busy={busyLink} />

              <ScheduleBox
                mode={mode}
                setMode={setMode}
                date={date}
                time={time}
                setDate={setDate}
                setTime={setTime}
                minDate={minDate}
                minTimeHint={minTimeHint}
                tzLabel={tzLabel}
              />
            </div>

            {/* Direita */}
            <div className="space-y-4">
              {/* Modelos & IA */}
              <SectionCard className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Modelos & IA</div>
                  <div className="text-[11px] text-[#6B7280]">Plataforma: <b>{platform === 'x' ? 'X' : platform}</b></div>
                </div>

                {platform === 'instagram' ? (
                  <div className="grid gap-3">
                    <div>
                      <label className="text-sm font-medium text-[#374151]">Keyword (Instagram)</label>
                      <input
                        className="mt-1 w-full border border-[#FFD9CF] rounded-lg px-3 py-2 text-sm"
                        placeholder="ex.: oferta, novidade, achado, lançamento…"
                        value={igKeyword}
                        onChange={(e) => setIgKeyword(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium text-[#374151]">Modelo pronto</div>
                      <select
                        className="border border-[#FFD9CF] rounded-lg px-2 py-1 text-xs"
                        value={igTemplateKey}
                        onChange={(e) => setIgTemplateKey(e.target.value)}
                      >
                        {IG_TEMPLATES.map(t => (
                          <option key={t.key} value={t.key}>{t.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={applyTemplate}
                        className="inline-flex items-center gap-1.5 rounded-md text-xs px-3 py-1.5 border border-[#FFD9CF] bg-white hover:bg-[#FFF4F0]"
                      >
                        Usar modelo
                      </button>
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
                        {busyCaption ? 'Gerando…' : 'Gerar com IA'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium text-[#374151]">Modelo pronto</div>
                      <select
                        className="border border-[#FFD9CF] rounded-lg px-2 py-1 text-xs"
                        value={fbTemplateKey}
                        onChange={(e) => setFbTemplateKey(e.target.value)}
                      >
                        {FB_TEMPLATES.map(t => (
                          <option key={t.key} value={t.key}>{t.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <button
                        onClick={applyTemplate}
                        className="inline-flex items-center gap-1.5 rounded-md text-xs px-3 py-1.5 border border-[#FFD9CF] bg-white hover:bg-[#FFF4F0]"
                      >
                        Usar modelo
                      </button>
                    </div>
                  </div>
                )}
              </SectionCard>

              <CaptionEditor
                caption={caption}
                setCaption={setCaption}
                placeholder={
                  platform === 'instagram'
                    ? 'Use um modelo pronto ou clique em “Gerar com IA”.'
                    : 'Use um modelo pronto ou escreva aqui sua legenda.'
                }
              />

              {/* Erro */}
              {errMsg && (
                <SectionCard>
                  <div className="p-2 text-xs rounded-md border border-[#FFD9CF] bg-[#FFF4F0] text-[#B42318]">
                    {errMsg}
                  </div>
                </SectionCard>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 px-4 md:px-6 py-3 border-t bg-white/90 backdrop-blur flex justify-end gap-2">
          <button className="px-4 py-2 rounded-lg border border-[#FFD9CF] hover:bg-[#FFF4F0]" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-[#EE4D2D] hover:bg-[#D8431F] text-white flex items-center gap-2 disabled:opacity-60"
            disabled={publishDisabled}
            onClick={() => {
              setMode('now');
              handleSubmit();
            }}
          >
            {busyLink || busyCaption ? <Loader2 className="animate-spin w-4 h-4" /> : null}
            Publicar
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#1f2937] text-white flex items-center gap-2 disabled:opacity-60"
            disabled={publishDisabled}
            onClick={() => {
              setMode('schedule');
              handleSubmit();
            }}
          >
            Agendar
          </button>
        </div>
      </aside>
    </div>
  );
}
