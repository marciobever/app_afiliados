// app/dashboard/page.tsx
"use client";

import * as React from "react";
import { SectionHeader } from "@/components/ui";
import PlatformCard from "@/components/PlatformCard";
import { PLATFORMS } from "@/components/brands";
import { SERVICES } from "@/components/services";
import ServiceCard from "@/components/ServiceCard";

export default function DashboardHome() {
  const [summary, setSummary] = React.useState<{ [k: string]: number } | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/dashboard/services/summary", { cache: "no-store" });
        const j = await res.json();
        if (alive && j?.ok) setSummary(j);
      } catch { setSummary(null); }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="relative mx-auto max-w-6xl px-2 pb-10 text-white">
      {/* hero simples no dark */}
      <header className="pt-1 sm:pt-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-[#FFB199] via-[#FF7A59] to-[#A78BFA] bg-clip-text text-transparent">
            Painel de operações
          </span>
        </h1>
        <p className="mt-1 text-sm text-white/70">
          Gerencie seus canais e ferramentas de automação em um só lugar.
        </p>
      </header>

      {/* Plataformas */}
      <SectionHeader
        emoji="🧭"
        title={<span className="text-white">Escolha a plataforma</span>}
        subtitle={<span className="text-white/70">Conecte e gerencie conteúdos de cada marketplace/rede.</span>}
      />
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PLATFORMS.map((p) => (
          <PlatformCard key={p.key} p={p} />
        ))}
      </div>

      {/* Serviços */}
      <div className="mt-10 rounded-[28px] border border-white/10 bg-white/[0.04] px-3 py-6 backdrop-blur-xl sm:px-5">
        <SectionHeader
          emoji="💎"
          title={<span className="text-white">Serviços</span>}
          subtitle={<span className="text-white/70">Ferramentas internas com automação, monitoramento e tracking.</span>}
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {SERVICES.map((s) => (
            <ServiceCard
              key={s.key}
              title={s.title}
              desc={s.desc}
              href={s.href}
              setupHref={s.setupHref}
              emoji={s.emoji}
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
    </div>
  );
}
