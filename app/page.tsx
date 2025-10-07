// app/dashboard/page.tsx
"use client";

import Link from "next/link";
import { Badge, Button, Card, CardBody, CardHeader, SectionHeader, cx } from "@/components/ui";

type Platform = {
  key: "shopee" | "amazon" | "mercado-livre" | "temu";
  name: string;
  desc: string;
  status: "live" | "soon";
  href?: string;
  color: string; // borda
  accent: string; // barra inferior
  emoji: string;
};

const PLATFORMS: Platform[] = [
  {
    key: "shopee",
    name: "Shopee",
    desc: "Buscar produtos e publicar com legendas automáticas.",
    status: "live",
    href: "/dashboard/shopee",
    color: "#EE4D2D",
    accent: "from-[#FECACA] to-[#EE4D2D]",
    emoji: "🟠",
  },
  {
    key: "amazon",
    name: "Amazon",
    desc: "Integração de buscas e publicações.",
    status: "soon",
    color: "#FF9900",
    accent: "from-[#FFE5B4] to-[#6B7280]",
    emoji: "🟧",
  },
  {
    key: "mercado-livre",
    name: "Mercado Livre",
    desc: "Integração de buscas e publicações.",
    status: "soon",
    color: "#FFDB15",
    accent: "from-[#FFF8B5] to-[#34D399]",
    emoji: "🟡",
  },
  {
    key: "temu",
    name: "Temu",
    desc: "Integração de buscas e publicações.",
    status: "soon",
    color: "#FA4B2A",
    accent: "from-[#FFD5CD] to-[#FA4B2A]",
    emoji: "🟠",
  },
];

export default function DashboardHome() {
  return (
    <div className="max-w-6xl mx-auto px-4 pb-10 space-y-6">
      <SectionHeader
        emoji="🗂️"
        title="Escolha a plataforma"
        subtitle="Conecte e gerencie conteúdos de cada marketplace/rede."
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {PLATFORMS.map((p) => (
          <Card key={p.key} className="overflow-hidden">
            <CardHeader
              title={
                <span className="inline-flex items-center gap-2">
                  <span className="text-lg">{p.emoji}</span>
                  {p.name}
                  {p.status === "live" ? (
                    <Badge tone="success" className="ml-2">disponível</Badge>
                  ) : (
                    <Badge className="ml-2">em breve</Badge>
                  )}
                </span>
              }
              subtitle={p.desc}
            />
            <CardBody>
              <div className="flex items-center justify-between">
                {p.status === "live" ? (
                  <Link href={p.href!}>
                    <Button>Abrir</Button>
                  </Link>
                ) : (
                  <Button disabled variant="outline" className="opacity-60 cursor-not-allowed">
                    Em breve
                  </Button>
                )}
              </div>
            </CardBody>

            {/* barra de acento inferior, sutil como nas configs */}
            <div
              className={cx(
                "h-3 w-full",
                "bg-gradient-to-r",
                p.accent
              )}
              style={{ borderTop: "1px solid #FFD9CF" }}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
