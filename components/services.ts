export type ServiceItem = {
  key: string;
  title: string;
  desc: string;
  href: string;
  setupHref?: string;
  emoji?: string;
  tag?: "novo" | "premium" | "beta";
};

// naming + copy mais “produto”
export const SERVICES: ServiceItem[] = [
  {
    key: "bots-ig",
    title: "EngageBot (Instagram)",
    desc: "Respostas automáticas por comentário e captura de leads.",
    href: "/dashboard/bots/instagram",
    emoji: "🤖",
    tag: "premium",
  },
  {
    key: "links",
    title: "SmartLinks",
    desc: "Encurtador com SubIDs, redirecionamento e métricas.",
    href: "/dashboard/links",
    emoji: "🔗",
  },
  {
    key: "price-tracker",
    title: "WatchHub",
    desc: "Monitoramento de preço e alertas personalizados.",
    href: "/dashboard/price-tracker",
    setupHref: "/dashboard/price-tracker?setup=1",
    emoji: "📉",
    tag: "novo",
  },
];
