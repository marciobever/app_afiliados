// app/components/Header.tsx  (ou onde fica o Header do APP)
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Props = { initialLoggedIn?: boolean };

type Me =
  | {
      ok: true;
      session: { userId: string; orgId: string };
      profile: { id: string; email: string; name?: string | null; is_active?: boolean };
    }
  | { ok: false; error?: string };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://seureview.com.br";

export default function Header({ initialLoggedIn = false }: Props) {
  const [loggedIn, setLoggedIn] = useState(initialLoggedIn);
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    let alive = true;

    async function check() {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        const j = (await r.json()) as Me;
        if (!alive) return;
        setMe(j);
        setLoggedIn(!!(j as any)?.ok);
      } catch {
        if (!alive) return;
        setMe({ ok: false });
        setLoggedIn(false);
      }
    }

    check();
    window.addEventListener("focus", check);
    return () => {
      alive = false;
      window.removeEventListener("focus", check);
    };
  }, []);

  const firstName =
    me && (me as any).ok && typeof (me as any).profile?.name === "string"
      ? (me as any).profile.name.split(" ")?.[0] ?? null
      : null;

  const btnPrimary =
    "px-4 py-2 rounded-lg text-sm bg-[#EE4D2D] hover:bg-[#D8431F] text-white shadow-sm";
  const btnGhost =
    "px-4 py-2 rounded-lg text-sm border border-[#FFD9CF] hover:bg-[#FFF4F0] text-[#111827]";

  // logout com redirecionamento direto (limpa cookie e volta pro site)
  const sair = () => {
    window.location.href = `/api/auth/logout?next=${encodeURIComponent(SITE_URL)}`;
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#FFD9CF]">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-end gap-2">
        {loggedIn && firstName && (
          <span
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-sm text-[#111827]"
            title="Sua conta"
          >
            <span
              className="inline-block h-[18px] w-[18px] rounded-full bg-[#EE4D2D]/10 ring-1 ring-[#EE4D2D]/30"
              aria-hidden="true"
            />
            Olá, {firstName}
          </span>
        )}

        {loggedIn && (
          <Link href="/dashboard/configuracoes" className={btnGhost}>
            Configurações
          </Link>
        )}

        {loggedIn && (
          <button onClick={sair} className={btnPrimary} title="Sair da conta">
            Sair
          </button>
        )}
      </div>
    </header>
  );
}
