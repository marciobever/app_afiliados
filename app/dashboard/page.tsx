// app/dashboard/page.tsx
"use client";

import { SectionHeader } from "@/components/ui";
import PlatformCard from "@/components/PlatformCard";
import { PLATFORMS } from "@/components/brands";

export default function DashboardHome() {
  return (
    <div className="relative max-w-6xl mx-auto px-4 pb-12">
      {/* pano de fundo leve, fixo (nada de translate/blur) */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-x-0 -top-8 h-28 -z-10"
        style={{
          background:
            "radial-gradient(80% 120% at 0% 0%, #FFF4F0 0%, transparent 70%)",
        }}
      />

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
    </div>
  );
}
