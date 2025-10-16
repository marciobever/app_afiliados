"use client";

import Link from "next/link";
import { Badge, Button, Card, cx } from "@/components/ui";
import type { Platform } from "@/components/brands";

/**
 * Visual premium para os cards de plataformas.
 * Compatível com o seu tipo Platform (usa p.available, p.brand.mono, p.href...).
 */
export default function PlatformCard({ p }: { p: Platform }) {
  const available = !!p.available;

  return (
    <Card
      className={cx(
        "group relative rounded-3xl border border-[#ffd9cf]/40 bg-white/80 p-6 shadow-md backdrop-blur-sm",
        "transition hover:-translate-y-0.5 hover:shadow-lg"
      )}
    >
      {/* selo (opcional) */}
      <div className="absolute right-5 top-5">
        <Badge tone={available ? "success" : "muted"}>
          {available ? "disponível" : "em breve"}
        </Badge>
      </div>

      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF4F0]">
            <span
              className="block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: available ? "#10B981" : "#F59E0B" }}
            />
          </div>
          <div>
            <h3 className="text-base font-semibold leading-tight">{p.name}</h3>
            <p className="mt-1 text-sm text-[#6B7280]">{p.desc}</p>
          </div>
        </div>

        {/* CTA */}
        {available ? (
          <Link href={p.href!}>
            <Button className="bg-gradient-to-b from-[#EE4D2D] to-[#D8431F] text-white hover:brightness-95 active:translate-y-px">
              Abrir
            </Button>
          </Link>
        ) : (
          <Button variant="outline" disabled>
            Em breve
          </Button>
        )}
      </div>

      {/* preview/placeholder */}
      <div className="mt-4 rounded-xl border border-dashed border-[#ffd9cf]/60 bg-white/60 p-4 text-center text-xs text-[#6B7280]">
        {available ? "Pronto para usar" : "Prévia em breve"}
      </div>
    </Card>
  );
}
