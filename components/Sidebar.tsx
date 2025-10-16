"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Home, Link2, LineChart, Store, Settings, Handshake } from "lucide-react";

const NAV = [
  { href: "/dashboard", icon: Home, label: "Visão geral" },
  { href: "/dashboard/afiliados", icon: Handshake, label: "Afiliados" },              // 👈 novo
  { href: "/dashboard/bots/instagram", icon: Bot, label: "Bots Instagram" },
  { href: "/dashboard/links", icon: Link2, label: "SmartLinks" },
  { href: "/dashboard/price-tracker", icon: LineChart, label: "WatchHub" },
  { href: "/dashboard/shopee", icon: Store, label: "Shopee" },
  { href: "/dashboard/configuracoes", icon: Settings, label: "Configurações" },       // 👈 correto
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <nav className="rounded-2xl border border-[#FFD9CF] bg-white shadow-sm">
      <div className="px-4 py-3 border-b border-[#FFD9CF]">
        <div className="text-xs text-[#6B7280]">workspace</div>
        <div className="font-semibold">SeuReview</div>
      </div>

      <ul className="p-2">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = path === href || (href !== "/dashboard" && path?.startsWith(href));
          return (
            <li key={href}>
              <Link
                href={href}
                className={[
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                  active
                    ? "bg-[#FFF4F0] text-[#111827] border border-[#FFD9CF]"
                    : "text-[#374151] hover:bg-[#FFF4F0]",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
