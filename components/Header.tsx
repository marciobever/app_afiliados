"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui";

type Props = { initialLoggedIn?: boolean };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://seureview.com.br";

export default function Header({ initialLoggedIn = false }: Props) {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(initialLoggedIn);
  const pathname = usePathname();

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

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setLoggedIn(false);
    window.location.href = "/login";
  }

  const homeHref = loggedIn ? "/dashboard" : "/login";
  const isConfig = pathname === "/dashboard/configuracoes";

  const btn = (...c: string[]) =>
    cx(
      "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm transition-colors",
      ...c
    );
  const ghost = "border border-[#FFD9CF] hover:bg-[#FFF4F0] text-[#111827]";
  const primary = "bg-[#EE4D2D] hover:bg-[#D8431F] text-white";

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href={homeHref} aria-label="Início" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#EE4D2D] text-white font-bold">SR</span>
            <span className="font-semibold text-gray-900">SeuReview</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2">
            <a href={SITE_URL} target="_blank" rel="noopener" className={btn(ghost)}>
              Voltar ao site
            </a>
            {loggedIn ? (
              <>
                <Link href="/dashboard" className={btn(ghost)}>
                  Painel
                </Link>
                <Link
                  href="/dashboard/configuracoes"
                  className={btn(isConfig ? primary : ghost)}
                >
                  Configurações
                </Link>
                <button onClick={logout} className={btn(primary)}>Sair</button>
              </>
            ) : (
              <>
                <Link href="/login" className={btn(ghost)}>Entrar</Link>
                <Link href="/signup" className={btn(primary)}>Criar conta</Link>
              </>
            )}
          </div>

          <button
            className={btn(ghost, "sm:hidden")}
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menu"
          >
            {open ? "Fechar" : "Menu"}
          </button>
        </div>

        {open && (
          <div className="sm:hidden mt-3 border-t pt-3 space-y-2">
            <a
              href={SITE_URL}
              target="_blank"
              rel="noopener"
              className="block rounded-lg px-2 py-2 text-sm hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              Voltar ao site
            </a>
            {loggedIn ? (
              <div className="grid grid-cols-1 gap-2">
                <Link href="/dashboard" className={btn(ghost)} onClick={() => setOpen(false)}>
                  Painel
                </Link>
                <Link href="/dashboard/configuracoes" className={btn(ghost)} onClick={() => setOpen(false)}>
                  Configurações
                </Link>
                <button onClick={logout} className={btn(primary)}>Sair</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                <Link href="/login" className={btn(ghost)} onClick={() => setOpen(false)}>
                  Entrar
                </Link>
                <Link href="/signup" className={btn(primary)} onClick={() => setOpen(false)}>
                  Criar conta
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
