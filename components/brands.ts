// components/brands.ts
export type PlatformKey = "shopee" | "amazon" | "mercado_livre" | "temu";

export type Platform = {
  key: PlatformKey;
  name: string;
  desc: string;
  href?: string;            // rota se disponível
  available: boolean;       // controla badge e botão
  brand: {
    // cores (oficiais ou próximas) para o card
    from: string; // gradiente início (hex ou rgb)
    to: string;   // gradiente fim
    ring: string; // borda/inset
    mono: string; // cor do monograma
    logo?: string; // caminho do svg em /public (opcional)
  };
};

export const PLATFORMS: Platform[] = [
  {
    key: "shopee",
    name: "Shopee",
    desc: "Buscar produtos e publicar com legendas automáticas.",
    href: "/dashboard/shopee",
    available: true,
    brand: {
      from: "#FFE6DF",
      to: "#FFF6F2",
      ring: "#FFD9CF",
      mono: "#EE4D2D",
      logo: "/brands/shopee.svg",
    },
  },
  {
    key: "amazon",
    name: "Amazon",
    desc: "Integração de buscas e publicações.",
    available: false,
    brand: {
      from: "#F2F3F5",
      to: "#FFFFFF",
      ring: "#E5E7EB",
      mono: "#FF9900",
      logo: "/brands/amazon.svg",
    },
  },
  {
    key: "mercado_livre",
    name: "Mercado Livre",
    desc: "Integração de buscas e publicações.",
    available: false,
    brand: {
      from: "#FFF9D6",
      to: "#FFFFFF",
      ring: "#FDE68A",
      mono: "#FFE600",
      logo: "/brands/mercado-livre.svg",
    },
  },
  {
    key: "temu",
    name: "Temu",
    desc: "Integração de buscas e publicações.",
    available: false,
    brand: {
      from: "#FFEAE2",
      to: "#FFFFFF",
      ring: "#FFD9CF",
      mono: "#FF5B2D",
      logo: "/brands/temu.svg",
    },
  },
];
