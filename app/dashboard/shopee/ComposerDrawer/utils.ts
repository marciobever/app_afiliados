// app/dashboard/shopee/ComposerDrawer/utils.ts

// Tipos
export type PlatformKey = 'facebook' | 'instagram' | 'x';

export type Product = {
  id: string;
  title: string;
  price: number | null;
  rating: number | null;
  image: string;
  url: string;
};

// Helpers visuais
export function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(' ');
}

// Limpa fences de resposta em texto (quando vem ```json ... ```)
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

/** Garante um Product completo/seguro antes de enviar pro backend */
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

/** Retorna 'YYYY-MM-DDTHH:mm' no fuso LOCAL somando X minutos a partir de agora */
export function dtLocalPlus(minutes: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  const p = (n: number) => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = p(d.getMonth() + 1);
  const day = p(d.getDate());
  const hh = p(d.getHours());
  const mm = p(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

/**
 * Converte 'YYYY-MM-DDTHH:mm' (interpreta como horário LOCAL do usuário)
 * para ISO UTC (terminando com 'Z'), ex.: '2025-10-09T12:30:00.000Z'
 */
export function localToIsoUtc(local: string): string {
  // Parse manual para garantir que seja tratado como horário LOCAL
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) throw new Error('Formato inválido de datetime-local');
  const [, y, mo, d, h, mi] = m.map(Number) as unknown as [
    number,
    number,
    number,
    number,
    number,
    number
  ];
  const dt = new Date(y, mo - 1, d, h, mi, 0, 0); // local time
  return dt.toISOString(); // to UTC ISO
}

/* -------------------- Modelos prontos -------------------- */
export const IG_TEMPLATES: Array<{
  key: string;
  label: string;
  build: (p: Product, link: string, kw: string) => string;
}> = [
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

export const FB_TEMPLATES: Array<{
  key: string;
  label: string;
  build: (p: Product, link: string) => string;
}> = [
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
