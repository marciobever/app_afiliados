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
  TimerReset,
  Clock4,
  AlarmClockOff,
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

function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [ok, setOk] = React.useState(false);
  return (
    <button
      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#FFD9CF] hover:bg-[#FFF4F0] text-xs disabled:opacity-50"
      onClick={async () => {
        await navigator.clipboard.writeText(text || '');
        setOk(true);
        setTimeout(() => setOk(false), 1000);
      }}
      disabled={!text}
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
    id,
    title: p?.title ?? '',
    price:
      typeof p?.price === 'number'
        ? p.price
        : p?.price != null
        ? Number(p.price as any)
        : null,
    rating:
      typeof p?.rating === 'number'
        ? p.rating
        : p?.rating != null
        ? Number(p.rating as any)
        : null,
    image: p?.image ?? '',
    url: p?.url ?? baseUrl,
  };
}

/** Converte `YYYY-MM-DDTHH:mm` (local) para ISO UTC */
function localToIsoUtc(dtLocal: string): string {
  if (!dtLocal) return '';
  const d = new Date(dtLocal);
  if (isNaN(d.getTime())) return '';
  return d.toISOString();
}

/** Retorna `YYYY-MM-DDTHH:mm` atual + offset minutos */
function dtLocalPlus(minutes = 0): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  // pad
  const p = (n: number) => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = p(d.getMonth() + 1);
  const day = p(d.getDate());
  const hh = p(d.getHours());
  const mm = p(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

/* -------------------- modelos prontos -------------------- */

const IG_TEMPLATES: Array<{ key: string; label: string; build: (p: Product, link: string, kw: string) => string }> = [
  {
    key: 'ig_minimal',
    label: 'IG — Minimal',
    build: (p, link, kw) =>
`${p.title}

${kw ? `✨ ${kw}\n\n` : ''}Confira aqui 👉 ${link}

#oferta #promo #achadinhos`
  },
  {
    key: 'ig_hook_body_hashtags',
    label: 'IG — Hook + Body + #',
    build: (p, link, kw) =>
`${kw ? `🔥 ${kw.toUpperCase()}!` : '🔥 Achado imperdível!'}
${p.title}

👉 Link: ${link}

#desconto #oportunidade #compras`
  },
  {
    key: 'ig_benefits',
    label: 'IG — Lista de benefícios',
    build: (p, link, kw) =>
`${p.title}

• Ótimo custo-benefício
• Entrega rápida
• Avaliações positivas

${kw ? `Palavra-chave: ${kw}\n` : ''}Veja mais 👉 ${link}

#achados #viralizou`
  },
];

const FB_TEMPLATES: Array<{ key: string; label: string; build: (p: Product, link: string) => string }> = [
  {
    key: 'fb_curto',
    label: 'FB — Direto e curto',
    build: (p, link) =>
`${p.title}

Confira 👉 ${link}`,
  },
  {
    key: 'fb_bullets',
    label: 'FB — Título + Bullets',
    build: (p, link) =>
`${p.title}

• Preço em conta
• Bom retorno nas reviews
• Link oficial: ${link}

#promo #oferta`,
  },
];

/* ---- chamadas backend ---- */

/** Link com SubIDs (n8n /webhook/shopee_subids via nosso proxy) */
async function getTrackedUrl(baseUrl: string, platform: PlatformKey, product?: Product) {
  const safeProduct = ensureSafeProduct(baseUrl, product);
  const r = await fetch('/api/integrations/shopee/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ base_url: baseUrl, platform, product: safeProduct }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || (j as any).error) throw new Error((j as any).message || (j as any).error || 'Falha ao montar SubIDs');
  return { url: ((j as any).url as string) || '' };
}

/** Gera legenda via IA (n8n /webhook/caption via /api/caption) */
async function fetchCaption(kind: 'instagram_caption' | 'facebook_caption', payload: any) {
  const r = await fetch('/api/caption', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/plain;q=0.9,*/*;q=0.8' },
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
  if (!r.ok || data?.error) throw new Error(data?.message || data?.error || `Falha ao gerar legenda`);
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
    platform,                 // 'facebook' | 'instagram' | 'x'
    product: safeProduct,
    link: trackedUrl,         // compat com workflow antigo
    trackedUrl,               // compat com mapeamento novo
    caption,
    scheduleTime: scheduleTime || null, // ISO em UTC se agendado
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
  // Bloqueia scroll do body ao abrir
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // SubIDs salvos (somente para exibir o ativo)
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

  // agendamento
  const [mode, setMode] = React.useState<'now' | 'schedule'>('now');
  const [dtLocal, setDtLocal] = React.useState<string>(dtLocalPlus(15)); // default +15m
  const minDt = dtLocalPlus(1); // pelo menos +1m

  // Carrega SubIDs salvos quando abrir
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
          products: [ensureSafeProduct(product.url, product)],
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
          : [`${product.title}`, `Confira aqui 👉 ${trackedUrl || product.url}`];
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
      if (!dtLocal) {
        setErrMsg('Escolha uma data/hora para agendar.');
        return;
      }
      const min = new Date(minDt).getTime();
      const whenTs = new Date(dtLocal).getTime();
      if (isNaN(whenTs) || whenTs < min) {
        setErrMsg('Escolha um horário no futuro (mínimo +1min).');
        return;
      }
      scheduleIso = localToIsoUtc(dtLocal);
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

  /* -------------------- UI -------------------- */

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-stretch justify-end"
      aria-modal="true"
      role="dialog"
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />

      {/* drawer */}
      <aside className="relative h-full w-full md:w-[980px] bg-white border-l shadow-2xl flex flex-col">
        {/* Sticky Header (não fica escondido) */}
        <div className="sticky top-0 z-10 px-4 md:px-6 py-3 border-b bg-white/90 backdrop-blur flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Globe2 className="w-4 h-4 text-[#EE4D2D]" />
            Composer
          </div>

          <div className="flex items-center gap-2">
            {/* Plataforma */}
            <div className="hidden md:flex items-center gap-1">
              {availablePlatforms.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={cx(
                    'px-3 py-1.5 rounded-full border text-xs',
                    platform === p ? 'bg-[#EE4D2D] text-white border-[#EE4D2D]' : 'bg-white border-[#FFD9CF] hover:bg-[#FFF4F0]'
                  )}
                  disabled={busyLink || busyCaption}
                  title={`Plataforma: ${p}`}
                >
                  {p === 'x' ? 'X' : p[0].toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            <button className="p-2 rounded hover:bg-[#FFF4F0]" aria-label="Fechar" onClick={onClose}>
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body em 2 colunas */}
        <div className="flex-1 overflow-auto px-4 md:px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna Esquerda: Produto + Link + Agendamento */}
            <div className="space-y-4">
              {/* Produto */}
              <div className="rounded-2xl border border-[#FFD9CF] p-3">
                <div className="flex gap-3">
                  <img src={product.image} alt="" className="w-20 h-20 rounded object-cover" />
                  <div className="min-w-0">
                    <div className="font-medium line-clamp-2">{product.title}</div>
                    {typeof product.price === 'number' && (
                      <div className="text-sm text-gray-600">R$ {Number(product.price).toFixed(2)}</div>
                    )}
                    <div className="text-xs text-gray-500">
                      ID: {product.id || deriveShopeeIdFromUrl(product.url)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Plataforma (mobile) + SubID ativo */}
              <div className="lg:hidden rounded-2xl border border-[#FFD9CF] p-3 space-y-2">
                <div className="text-sm font-medium">Plataforma</div>
                <div className="mt-1 flex gap-2 flex-wrap">
                  {availablePlatforms.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={cx(
                        'px-3 py-1.5 rounded-full border text-xs',
                        platform === p ? 'bg-[#EE4D2D] text-white border-[#EE4D2D]' : 'bg-white border-[#FFD9CF] hover:bg-[#FFF4F0]'
                      )}
                      disabled={busyLink || busyCaption}
                    >
                      {p === 'x' ? 'X' : p[0].toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[#6B7280]">
                  SubID ativo: <span className="font-medium">{activeSubId || '(padrão vazio)'}</span>
                </p>
              </div>

              {/* Link rastreável */}
              <div className="rounded-2xl border border-[#FFD9CF] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Link rastreável</div>
                  {trackedUrl ? <CopyButton text={trackedUrl} label="Copiar link" /> : null}
                </div>
                <div className="text-xs text-[#6B7280]">
                  {busyLink ? 'Gerando link…' : trackedUrl ? 'Pronto.' : 'Sem link ainda.'}
                </div>
                <input
                  className="w-full mt-2 border border-[#FFD9CF] rounded-lg px-3 py-2 text-sm"
                  value={trackedUrl}
                  readOnly
                />
              </div>

              {/* Agendamento (sempre visível) */}
              <div className="rounded-2xl border border-[#FFD9CF] p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Publicação</div>
                  <div className="text-[11px] text-[#6B7280] flex items-center gap-1">
                    <CalendarClock className="w-3.5 h-3.5" />
                    Fuso local do navegador
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className={cx(
                      'flex-1 px-3 py-2 rounded-lg border text-sm',
                      mode === 'now' ? 'bg-[#EE4D2D] text-white border-[#EE4D2D]' : 'bg-white border-[#FFD9CF] hover:bg-[#FFF4F0]'
                    )}
                    onClick={() => setMode('now')}
                  >
                    Publicar agora
                  </button>
                  <button
                    className={cx(
                      'flex-1 px-3 py-2 rounded-lg border text-sm',
                      mode === 'schedule' ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white border-[#FFD9CF] hover:bg-[#FFF4F0]'
                    )}
                    onClick={() => setMode('schedule')}
                  >
                    Agendar
                  </button>
                </div>

                {mode === 'schedule' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data e horário</label>
                    <input
                      type="datetime-local"
                      className="w-full border border-[#FFD9CF] rounded-lg px-3 py-2 text-sm"
                      value={dtLocal}
                      min={minDt}
                      onChange={(e) => setDtLocal(e.target.value)}
                    />

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        className="px-2.5 py-1.5 text-xs rounded-md border border-[#FFD9CF] hover:bg-[#FFF4F0] inline-flex items-center gap-1"
                        onClick={() => setDtLocal(dtLocalPlus(15))}
                        title="+15 minutos"
                      >
                        <TimerReset className="w-3.5 h-3.5" /> +15m
                      </button>
                      <button
                        type="button"
                        className="px-2.5 py-1.5 text-xs rounded-md border border-[#FFD9CF] hover:bg-[#FFF4F0] inline-flex items-center gap-1"
                        onClick={() => setDtLocal(dtLocalPlus(60))}
                        title="+1 hora"
                      >
                        <Clock4 className="w-3.5 h-3.5" /> +1h
                      </button>
                      <button
                        type="button"
                        className="px-2.5 py-1.5 text-xs rounded-md border border-[#FFD9CF] hover:bg-[#FFF4F0] inline-flex items-center gap-1"
                        onClick={() => setDtLocal(dtLocalPlus(180))}
                        title="+3 horas"
                      >
                        <Clock4 className="w-3.5 h-3.5" /> +3h
                      </button>
                      <button
                        type="button"
                        className="px-2.5 py-1.5 text-xs rounded-md border border-[#FFD9CF] hover:bg-[#FFF4F0] inline-flex items-center gap-1"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 1);
                          d.setHours(9, 0, 0, 0);
                          const y = d.getFullYear();
                          const m = String(d.getMonth() + 1).padStart(2, '0');
                          const day = String(d.getDate()).padStart(2, '0');
                          setDtLocal(`${y}-${m}-${day}T09:00`);
                        }}
                        title="Amanhã 09:00"
                      >
                        <CalendarClock className="w-3.5 h-3.5" /> amanhã 9h
                      </button>
                      <button
                        type="button"
                        className="px-2.5 py-1.5 text-xs rounded-md border border-[#FFD9CF] hover:bg-[#FFF4F0] inline-flex items-center gap-1"
                        onClick={() => setDtLocal(dtLocalPlus(15))}
                        title="Reset para +15m"
                      >
                        <AlarmClockOff className="w-3.5 h-3.5" /> reset
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Coluna Direita: Legenda e IA */}
            <div className="space-y-4">
              {/* Modelos & IA */}
              <div className="rounded-2xl border border-[#FFD9CF] p-3 space-y-3">
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
                      <p className="text-[11px] text-[#6B7280] mt-1">
                        Usada nos modelos prontos e nas legendas com IA.
                      </p>
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
              </div>

              {/* Legenda */}
              <div className="rounded-2xl border border-[#FFD9CF] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Legenda</div>
                  <CopyButton text={caption} label="Copiar legenda" />
                </div>
                {busyCaption && <div className="text-[11px] text-[#EE4D2D]">gerando…</div>}
                <textarea
                  className="w-full border border-[#FFD9CF] rounded-lg p-2 text-sm min-h-[220px]"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={
                    platform === 'instagram'
                      ? 'Use um modelo pronto ou clique em “Gerar com IA”.'
                      : 'Use um modelo pronto ou escreva aqui sua legenda.'
                  }
                />
                <p className="text-[11px] text-[#6B7280]">
                  Dica: no Instagram, o link é tratado fora da legenda (shortlink).
                </p>
              </div>

              {/* Alertas / Erros */}
              {errMsg && (
                <div className="p-2 text-xs rounded-md border border-[#FFD9CF] bg-[#FFF4F0] text-[#B42318]">
                  {errMsg}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer: ações principais sempre visíveis */}
        <div className="sticky bottom-0 z-10 px-4 md:px-6 py-3 border-t bg-white/90 backdrop-blur flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="text-[11px] text-[#6B7280] flex-1">
            {mode === 'schedule'
              ? <>Agendado para <b>{dtLocal.replace('T', ' ')}</b> (local) — será enviado em UTC para o n8n.</>
              : <>Publicação imediata na plataforma selecionada.</>}
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-lg border border-[#FFD9CF] hover:bg-[#FFF4F0]" onClick={onClose}>
              Cancelar
            </button>
            <button
              className={cx(
                'px-4 py-2 rounded-lg text-white flex items-center gap-2 disabled:opacity-60',
                mode === 'schedule' ? 'bg-[#111827] hover:bg-[#1f2937]' : 'bg-[#EE4D2D] hover:bg-[#D8431F]'
              )}
              disabled={publishDisabled}
              onClick={handleSubmit}
            >
              {(busyLink || busyCaption) ? <Loader2 className="animate-spin w-4 h-4" /> : <CalendarClock className="w-4 h-4" />}
              {mode === 'schedule' ? 'Agendar' : 'Publicar agora'}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
