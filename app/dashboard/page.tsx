// app/dashboard/page.tsx
"use client";

import * as React from "react";
import { SectionHeader } from "@/components/ui";
import PlatformCard from "@/components/PlatformCard";
import { PLATFORMS } from "@/components/brands";

import { SERVICES } from "@/components/services";
import ServiceCard from "@/components/ServiceCard";

export default function DashboardHome() {
  // métricas para os cards de serviços
  const [summary, setSummary] = React.useState<{ [k: string]: number } | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/dashboard/services/summary", { cache: "no-store" });
        const j = await res.json();
        if (alive && j?.ok) setSummary(j);
      } catch {
        setSummary(null);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="relative max-w-6xl mx-auto px-4 pb-12">
      {/* pano de fundo leve, fixo (nada de translate/blur) */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-x-0 -top-8 h-28 -z-10"
        style={{ background: "radial-gradient(80% 120% at 0% 0%, #FFF4F0 0%, transparent 70%)" }}
      />

      {/* Plataformas */}
      <SectionHeader
        emoji="🧭"
        title="Escolha a plataforma"
        subtitle="Conecte e gerencie conteúdos de cada marketplace/rede."
      />
      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {PLATFORMS.map((p) => (
          <PlatformCard key={p.key} p={p} />
        ))}
      </div>

      {/* Serviços */}
      <SectionHeader
        emoji="🧰"
        title="Serviços"
        subtitle="Ferramentas internas para automação e tracking."
      />
      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {SERVICES.map((s) => (
          <ServiceCard
            key={s.key}
            title={s.title}
            desc={s.desc}
            href={s.href}
            setupHref={s.setupHref}
            emoji={s.emoji}
            /* isNew removido */
            metrics={
              s.key === "links"
                ? [
                    { label: "Links", value: summary?.links ?? 0, loading: !summary },
                    { label: "Cliques", value: summary?.clicks ?? 0, loading: !summary },
                  ]
                : s.key === "price-tracker"
                ? [
                    { label: "Watchlists", value: summary?.watches ?? 0, loading: !summary },
                    { label: "Preços", value: summary?.prices ?? 0, loading: !summary },
                  ]
                : []
            }
          />
        ))}
      </div>
    </div>
  );
}
