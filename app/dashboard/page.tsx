// app/dashboard/page.tsx
"use client";

import * as React from "react";
import { SectionHeader, Card } from "@/components/ui";
import PlatformCard from "@/components/PlatformCard";
import { PLATFORMS } from "@/components/brands";
import { SERVICES } from "@/components/services";
import ServiceCard from "@/components/ServiceCard";

/* --- KPI card simples (tema claro) --- */
function StatCard({ label, value, loading }: { label: string; value?: number | string; loading?: boolean }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-[#6B7280]">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{loading ? "…" : value ?? 0}</div>
    </Card>
  );
}

export default function DashboardHome() {
  const [summary, setSummary] = React.useState<Record<string, number> | null>(null);

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
    <div className="pb-12">
      {/* Cabeçalho padrão */}
      <SectionHeader
        emoji="🧭"
        title="Painel de operações"
        subtitle="Acompanhe métricas, conecte plataformas e acesse os serviços."
      />

      {/* Resumo (KPIs) */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cliques" value={summary?.clicks} loading={!summary} />
        <StatCard label="Links" value={summary?.links} loading={!summary} />
        <StatCard label="Watchlists" value={summary?.watches} loading={!summary} />
        <StatCard label="Preços monitorados" value={summary?.prices} loading={!summary} />
      </div>

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
