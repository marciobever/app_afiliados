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

/* ----------------- helpers base ----------------- */
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

/* ----------------- tempo / datas ----------------- */
function pad(n: number) { return String(n).padStart(2, '0'); }

export function todayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function roundToNextMinutes(step: number): string {
  const d = new Date();
  const minutes = d.getMinutes();
  const rounded = Math.ceil((minutes + 1) / step) * step; // +1 p/ evitar "agora"
  d.setMinutes(rounded, 0, 0);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Junta date (YYYY-MM-DD) e time (HH:mm) como horário local
 * e retorna ISO UTC (ex.: 2025-10-09T12:30:00Z).
 */
export function combineDateTimeToIsoUtc(dateStr: string, timeStr: string): string {
  const [y, m, d] = (dateStr || todayLocalDate()).split('-').map(n => parseInt(n, 10));
  const [hh, mm] = (timeStr || roundToNextMinutes(15)).split(':').map(n => parseInt(n, 10));
  const dt = new Date(y, (m - 1), d, hh, mm, 0, 0); // <- LOCAL time
  return dt.toISOString(); // ISO UTC
}

/* ----------------- modelos prontos ----------------- */
export const IG_TEMPLATES: Array<{ key: string; label: string; build: (p: Product, link: string, kw: string) => string }> = [
  {
    key: 'ig_minimal',
    label: 'IG — Minimal',
    build: (p, link, kw) =>
`${p.title}

${kw ? `✨ ${kw}\n\n` : ''}Confira aqui 👉 ${link}

#oferta #promo #achadinhos`,
  },
  {
    key: 'ig_hook_body_hashtags',
    label: 'IG — Hook + Body + #',
    build: (p, link, kw) =>
`${kw ? `🔥 ${kw.toUpperCase()}!` : '🔥 Achado imperdível!'}
${p.title}

👉 Link: ${link}

#desconto #oportunidade #compras`,
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

#boanoite #achados #viralizou`,
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

#promo #oferta #facebook`,
  },
];
