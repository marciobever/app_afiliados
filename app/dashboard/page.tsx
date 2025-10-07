// app/dashboard/page.tsx
"use client";

import { SectionHeader } from "@/components/ui";
import PlatformCard from "@/components/PlatformCard";
import { PLATFORMS } from "@/components/brands";

export default function DashboardHome() {
  return (
    <div className="max-w-6xl mx-auto px-4 pb-12">
      {/* faixa suave atrás (radial) */}
      <div className="-mx-4 mb-6">
        <div className="h-20 w-full bg-[radial-gradient(80%_120%_at_0%_0%,#FFF4F0,transparent_70%)]" />
      </div>

      <SectionHeader
        emoji="🧭"
        title={
          <>
            Escolha a plataforma
          </>
        }
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
