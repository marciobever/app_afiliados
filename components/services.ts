export type ServiceItem = {
  key: string;
  title: string;
  desc: string;
  href: string;
  setupHref?: string;
  emoji?: string;
  isNew?: boolean;
};

// Ajuste esta lista como quiser
export const SERVICES: ServiceItem[] = [
  {
    key: "bots-ig",
    title: "Bots (Instagram)",
    desc: "Responder comentários 'quero' automaticamente.",
    href: "/dashboard/bots/instagram",
    emoji: "🤖",
  },
  {
    key: "links",
    title: "Links",
    desc: "Encurtador com SubIDs e métricas.",
    href: "/dashboard/links",
    emoji: "🔗",
  },
  {
    key: "price-tracker",
    title: "Price Tracker",
    desc: "Monitoramento de preço e alertas.",
    href: "/dashboard/price-tracker",
    setupHref: "/dashboard/price-tracker?setup=1",
    emoji: "📉",
    isNew: true,
  },
];
