'use client';
import Link from "next/link";
import { Badge, Card } from "@/components/ui";

type Metric = { label: string; value: string | number; loading?: boolean };

export default function ServiceCard({
  title, desc, href, setupHref, emoji = "🧩", isNew = false, metrics = []
}: {
  title: string; desc: string; href: string; setupHref?: string;
  emoji?: string; isNew?: boolean; metrics?: Metric[];
}) {
  return (
    <Card className="p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="text-2xl">{emoji}</div>
        {isNew && <Badge tone="success">novo</Badge>}
      </div>

      <h3 className="mt-2 font-semibold">{title}</h3>
      <p className="text-sm text-[#6B7280]">{desc}</p>

      {!!metrics.length && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {metrics.map((m, i) => (
            <div key={i} className="rounded-lg border border-[#FFD9CF] px-3 py-2">
              <div className="text-xs text-[#6B7280]">{m.label}</div>
              <div className="text-base font-semibold">
                {m.loading ? "…" : m.value}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Link href={href} className="px-3 py-2 rounded-lg text-sm bg-[#EE4D2D] hover:bg-[#D8431F] text-white">
          Abrir
        </Link>
        {setupHref && (
          <Link href={setupHref} className="px-3 py-2 rounded-lg text-sm border border-[#FFD9CF] hover:bg-[#FFF4F0]">
            Configurar
          </Link>
        )}
      </div>
    </Card>
  );
}
