// components/Hero.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Hero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section className="relative overflow-hidden">
      {/* Glow/Neon */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
        style={{
          background:
            "radial-gradient(1200px 600px at 10% -10%, rgba(238,77,45,0.25) 0%, rgba(238,77,45,0) 60%), radial-gradient(900px 500px at 100% 0%, rgba(255,140,105,0.20) 0%, rgba(255,140,105,0) 55%)",
          filter: mounted ? "saturate(1.05)" : "none",
        }}
      />

      <div className="mx-auto max-w-7xl px-6 py-10 md:py-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Texto */}
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-medium text-[#EE4D2D] bg-[#FFF1ED] border border-[#FFD9CF] rounded-full px-2.5 py-1">
              Novo • Multi-marketplaces
            </p>
            <h1 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1]">
              <span className="text-gradient">Encontre produtos virais</span> e publique em minutos.
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-[58ch]">
              SeuReview conecta você às melhores ofertas da{" "}
              <strong>Shopee</strong>, <strong>Amazon</strong>, <strong>Mercado Livre</strong>,{" "}
              <strong>AliExpress</strong> e <strong>Temu</strong> — com legendas inteligentes,
              links rastreáveis (UTM/SubIDs) e um fluxo simples para publicar nas redes.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/signup" className="btn btn-primary">Começar agora</Link>
              <Link href="/#como-funciona" className="btn btn-ghost">Ver como funciona</Link>
            </div>

            {/* “Marcas” */}
            <div className="mt-8 flex flex-wrap items-center gap-2 text-xs text-gray-600">
              {["Shopee", "Amazon", "Mercado Livre", "AliExpress", "Temu"].map((m) => (
                <span key={m} className="badge">{m}</span>
              ))}
            </div>
          </div>

          {/* Mock do painel */}
          <div className="relative">
            <div className="card overflow-hidden">
              <div className="card-body">
                <div className="h-64 w-full rounded-xl bg-gray-50 grid place-items-center text-gray-400 text-sm">
                  Prévia do painel / composer
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="chip">Legenda (IA)</div>
                  <div className="chip">UTM + SubIDs</div>
                  <div className="chip">Agendamento</div>
                </div>
              </div>
            </div>

            {/* Glow sutil na lateral */}
            <div className="pointer-events-none absolute -z-10 -right-10 -top-10 h-48 w-48 rounded-full blur-3xl"
                 style={{ background: "rgba(238,77,45,0.25)" }} />
          </div>
        </div>
      </div>
    </section>
  );
}
