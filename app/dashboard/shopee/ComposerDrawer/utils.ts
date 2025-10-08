// app/dashboard/shopee/ComposerDrawer/utils.ts
'use client';

export type PlatformKey = 'facebook' | 'instagram' | 'x';

export type Product = {
  id: string;
  title: string;
  price: number | null;
  rating: number | null;
  image: string;
  url: string;
};

export function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(' ');
}

export function stripFences(s: string) {
  return String(s)
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
}

/** Deriva ID Shopee a partir da URL (shopId_itemId) */
export function deriveShopeeIdFromUrl(url?: string): string {
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
export function ensureSafeProduct(baseUrl: string, p?: Product | null): Product {
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
export function localToIsoUtc(dtLocal: string): string {
  if (!dtLocal) return '';
  const d = new Date(dtLocal);
  if (isNaN(d.getTime())) return '';
  return d.toISOString();
}

/** Retorna `YYYY-MM-DDTHH:mm` atual + offset minutos */
export function dtLocalPlus(minutes = 0): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* -------------------- templates -------------------- */

export const IG_TEMPLATES: Array<{ key: string; label: string; build: (p: Product, link: string, kw: string) => string }> = [
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

export const FB_TEMPLATES: Array<{ key: string; label: string; build: (p: Product, link: string) => string }> = [
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
