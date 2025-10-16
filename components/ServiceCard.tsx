'use client';

import Link from "next/link";
import { Badge, Card } from "@/components/ui";

type Metric = { label: string; value: string | number; loading?: boolean };

export default function ServiceCard({
  title,
  desc,
  href,
  setupHref,
  emoji = "🧩",
  tag,
  metrics = [],
}: {
  title: string;
  desc: string;
  href: string;
  setupHref?: string;
  emoji?: string;
  tag?: "novo" | "premium" | "beta";
  metrics?: Metric[];
}) {
  const tagTone = tag === "novo" || tag === "premium" ? "success" : "muted";

  return (
    <Card className="group relative rounded-3xl border border-[#ffd9cf]/40 bg-white/80 p-6 shadow-md backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      {/* tag */}
      {tag && (
        <div className="absolute right-4 top-4">
          <Badge tone={tagTone as any}>{tag}</Badge>
        </div>
      )}

      {/* header com ícone em chip */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF4F0] text-xl text-[#EE4D2D]">
          {emoji}
        </div>
        <div>
          <h3 className="text-base font-semibold leading-tight">{title}</h3>
          <p className="mt-0.5 text-sm text-[#6B7280]">{desc}</p>
        </div>
      </div>

      {/* métricas compactas */}
      {!!metrics.length && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {metrics.map((m, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#ffd9cf]/50 px-3 py-2"
            >
              <div className="text-xs text-[#6B7280]">{m.label}</div>
              <div className="text-base font-semibold">
                {m.loading ? "…" : m.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ações */}
      <div className="mt-5 flex gap-2">
        <Link
          href={href}
          className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm text-white transition
                     bg-gradient-to-b from-[#EE4D2D] to-[#D8431F] hover:brightness-[.98] active:translate-y-px"
        >
          Abrir
        </Link>
        {setupHref && (
          <Link
            href={setupHref}
            className="inline-flex items-center justify-center rounded-lg border border-[#FFD9CF] px-4 py-2 text-sm text-[#111827] transition hover:bg-[#FFF4F0]"
          >
            Configurar
          </Link>
        )}
      </div>
    </Card>
  );
}
