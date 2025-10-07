export type Platform = {
  slug: 'shopee' | 'amazon' | 'mercadolivre' | 'temu';
  name: string;
  color: string;      // cor principal
  description: string;
  badgeText: string;  // “logo” simplificada
};

export const PLATFORMS: Platform[] = [
  {
    slug: 'shopee',
    name: 'Shopee',
    color: '#EE4D2D',
    description: 'Busque produtos e publique com legendas automáticas.',
    badgeText: 'S',
  },
  {
    slug: 'amazon',
    name: 'Amazon',
    color: '#FF9900',
    description: 'Integração de buscas e publicações (em breve).',
    badgeText: 'a',
  },
  {
    slug: 'mercadolivre',
    name: 'Mercado Livre',
    color: '#FFE600',
    description: 'Integração de buscas e publicações (em breve).',
    badgeText: 'ML',
  },
  {
    slug: 'temu',
    name: 'Temu',
    color: '#FF5B00',
    description: 'Integração de buscas e publicações (em breve).',
    badgeText: 'T',
  },
];
