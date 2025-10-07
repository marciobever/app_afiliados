"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";

type Props = { initialLoggedIn?: boolean };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://seureview.com.br";

export default function Header({ initialLoggedIn = false }: Props) {
  const [loggedIn, setLoggedIn] = useState(initialLoggedIn);

  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        setLoggedIn(r.ok);
      } catch {
        setLoggedIn(false);
      }
    };
    check();
    window.addEventListener("focus", check);
    return () => window.removeEventListener("focus", check);
  }, []);

  async function sair() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    window.location.href = SITE_URL; // volta pro site
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#FFD9CF]">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-end gap-2">
        {loggedIn && (
          <Link
            href="/dashboard/configuracoes"
            className="px-4 py-2 rounded-lg text-sm border border-[#FFD9CF] hover:bg-[#FFF4F0] text-[#111827]"
          >
            Configurações
          </Link>
        )}
        <Button onClick={sair}>Sair</Button>
      </div>
    </header>
  );
}
