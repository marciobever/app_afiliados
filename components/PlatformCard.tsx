"use client";

import Link from "next/link";
import { Badge, Button, Card, CardBody, CardHeader, cx } from "@/components/ui";
import type { Platform } from "@/components/brands";

export default function PlatformCard({ p }: { p: Platform }) {
  const disabled = !p.available;

  return (
    <Card
      className={cx(
        "transition-shadow hover:shadow-sm",
        "border-[#FFD9CF] bg-white"
      )}
    >
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            {/* marcador de cor da plataforma (no lugar da logo) */}
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: p.brand.mono }}
            />
            <span className="font-semibold">{p.name}</span>
            {p.available ? (
              <Badge tone="success">disponível</Badge>
            ) : (
              <Badge>em breve</Badge>
            )}
          </span>
        }
        subtitle={<span className="text-[#6B7280]">{p.desc}</span>}
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
      <CardBody>
        <div className="h-20 rounded-xl border border-dashed border-[#FFD9CF] bg-white flex items-center justify-center text-xs text-[#6B7280]">
          {disabled ? "Prévia em breve" : "Pronto para usar"}
        </div>
      </CardBody>
    </Card>
  );
}
