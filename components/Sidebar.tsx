"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Home, Link2, LineChart, Store, Settings } from "lucide-react";

const NAV = [
  { href: "/dashboard", icon: Home, label: "Visão geral" },
  { href: "/dashboard/bots/instagram", icon: Bot, label: "Bots Instagram" },
  { href: "/dashboard/links", icon: Link2, label: "SmartLinks" },
  { href: "/dashboard/price-tracker", icon: LineChart, label: "WatchHub" },
  { href: "/dashboard/shopee", icon: Store, label: "Shopee" },
  { href: "/dashboard/settings", icon: Settings, label: "Configurações" },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <nav className="relative h-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
      {/* filete neon */}
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-[#FF7A59] via-[#A78BFA] to-[#34D399] opacity-70" />
      <div className="p-3">
        <div className="mb-3 rounded-xl bg-gradient-to-r from-white/10 to-white/5 px-4 py-3">
          <div className="text-xs text-white/60">workspace</div>
          <div className="font-semibold">SeuReview</div>
        </div>
        <ul className="space-y-1">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active =
              path === href || (href !== "/dashboard" && path?.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={[
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 transition",
                    active
                      ? "bg-white/15 text-white shadow-[0_0_16px_rgba(255,122,89,0.25)]"
                      : "text-white/70 hover:text-white hover:bg-white/10",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      {/* glow inferior */}
      <div className="pointer-events-none absolute -bottom-8 left-1/2 h-12 w-2/3 -translate-x-1/2 rounded-full bg-[#FF7A59]/40 blur-3xl opacity-30" />
    </nav>
  );
}
