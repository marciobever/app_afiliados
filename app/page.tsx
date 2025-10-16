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
      } catch {
        setSummary(null);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="relative mx-auto max-w-6xl px-4 pb-16">
      {/* HERO premium */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-14 h-48 -z-10"
        style={{
          background:
            "radial-gradient(120% 120% at 0% 0%, #FFF4F0 0%, rgba(255,244,240,0.0) 60%), radial-gradient(60% 80% at 100% 0%, #FFE9E2 0%, rgba(255,233,226,0.0) 65%)",
        }}
      />
      <div className="pt-4 sm:pt-6">
        <h1 className="text-3xl sm:text-[32px] font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-[#EE4D2D] to-[#FF9D7E] bg-clip-text text-transparent">
            Painel de operações
          </span>
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Gerencie seus canais e ferramentas de automação em um só lugar.
        </p>
      </div>

      {/* Plataformas (mantém seu visual) */}
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

      {/* Serviços — bloco com “glass” leve */}
      <section className="mt-12 rounded-[28px] bg-gradient-to-b from-[#FFF9F7] to-white px-3 py-8 sm:px-5">
        <SectionHeader
          emoji="💎"
          title="Serviços"
          subtitle="Ferramentas internas com automação, monitoramento e tracking."
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
              tag={s.tag}
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
      </section>
    </div>
  );
}
