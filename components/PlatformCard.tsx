// components/PlatformCard.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge, Button, Card, CardBody, CardHeader, cx } from "@/components/ui";
import type { Platform } from "@/components/brands";

function LogoBadge({
  name,
  mono,
  logo,
}: {
  name: string;
  mono: string;
  logo?: string;
}) {
  if (logo) {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl overflow-hidden ring-1 ring-black/5 bg-white/80">
        <Image src={logo} alt={name} width={20} height={20} />
      </span>
    );
  }
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-white font-semibold ring-1 ring-black/5"
      style={{ backgroundColor: mono }}
    >
      {initials}
    </span>
  );
}

export default function PlatformCard({ p }: { p: Platform }) {
  const disabled = !p.available;

  return (
    <Card
      className={cx(
        "transition-shadow",
        "hover:shadow-md" // sem translate para não bugar com Safari
      )}
      style={{ borderColor: p.brand.ring }}
    >
      {/* fundo sutil (sem blur/transform) */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${p.brand.from}, ${p.brand.to})`,
        }}
      />

      <CardHeader
        className="relative bg-white/75"
        title={
          <span className="inline-flex items-center gap-2">
            <LogoBadge name={p.name} mono={p.brand.mono} logo={p.brand.logo} />
            <span className="font-semibold">{p.name}</span>
            {p.available ? <Badge tone="success">disponível</Badge> : <Badge>em breve</Badge>}
          </span>
        }
        subtitle={<span>{p.desc}</span>}
        right={
          p.available ? (
            <Link href={p.href!}>
              <Button>Abrir</Button>
            </Link>
          ) : (
            <Button variant="outline" disabled>
              Em breve
            </Button>
          )
        }
      />

      <CardBody className="relative">
        <div className="h-20 rounded-xl border border-dashed border-black/10 bg-white/60 flex items-center justify-center text-xs text-[#6B7280]">
          {disabled ? "Prévia em breve" : "Pronto para usar"}
        </div>
      </CardBody>
    </Card>
  );
}
