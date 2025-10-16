// components/affiliates.ts
export type AffiliateProvider = {
  key: string;
  name: string;
  desc: string;
  href: string;        // página do produto interno
  settingsHref?: string;
  emoji?: string;      // simples e rápido; dá pra trocar por logo depois
  kpis?: Array<{ key: string; label: string }>;
};

export const AFFILIATES: AffiliateProvider[] = [
  {
    key: "shopee-aff",
    name: "Shopee Afiliados",
    desc: "Conecte sua conta e acompanhe cliques e conversões.",
    href: "/dashboard/afiliados/shopee",
    settingsHref: "/dashboard/configuracoes?tab=integracoes#shopee",
    emoji: "🟧",
    kpis: [
      { key: "clicks", label: "Cliques" },
      { key: "orders", label: "Pedidos" },
    ],
  },
  {
    key: "amazon-associates",
    name: "Amazon Associates",
    desc: "Tracking de subIDs e métricas detalhadas.",
    href: "/dashboard/afiliados/amazon",
    settingsHref: "/dashboard/configuracoes?tab=integracoes#amazon",
    emoji: "🟨",
    kpis: [
      { key: "clicks", label: "Cliques" },
      { key: "revenue", label: "Receita" },
    ],
  },
  {
    key: "meli-aff",
    name: "Mercado Livre Afiliados",
    desc: "Monitoramento de links e performance.",
    href: "/dashboard/afiliados/meli",
    settingsHref: "/dashboard/configuracoes?tab=integracoes#meli",
    emoji: "🟡",
    kpis: [
      { key: "clicks", label: "Cliques" },
      { key: "orders", label: "Pedidos" },
    ],
  },
];
