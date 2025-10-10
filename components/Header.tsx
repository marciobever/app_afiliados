// app/components/Header.tsx
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
  const badge =
    "hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#FFD9CF] bg-[#FFF4F0] px-2 py-[6px] text-[12px] leading-none text-[#7A2E1B]";

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-[#FFD9CF]">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center gap-3">
        {/* Brand (volta pro dashboard) */}
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-grid h-8 w-8 place-items-center rounded-lg bg-[#EE4D2D] text-white font-bold">
            SR
          </span>
          <span className="hidden xs:inline">SeuReview</span>
        </Link>

        {/* Ações à direita */}
        <nav className="ml-auto flex flex-wrap items-center gap-2">
          {loggedIn && firstName && (
            <span className={badge} title="Sua conta">
              <span className="inline-block h-4 w-4 rounded-full bg-[#FEC6B8]" />
              Olá, {firstName}
            </span>
          )}

          {loggedIn && (
            <>
              <Link href="/dashboard/perfil" className={btnGhost}>
                Perfil
              </Link>
              <Link href="/dashboard/configuracoes" className={btnGhost}>
                Configurações
              </Link>
              {/* Logout por GET com redirect direto pro site */}
              <a
                href={`/api/auth/logout?next=${encodeURIComponent(SITE_URL)}`}
                className={btnPrimary}
              >
                Sair
              </a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
