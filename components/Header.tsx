"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Props = { initialLoggedIn?: boolean };

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://seureview.com.br";

export default function Header({ initialLoggedIn = false }: Props) {
  const [open, setOpen] = useState(false);
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

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setLoggedIn(false);
    window.location.href = "/login";
  }

  const homeHref = loggedIn ? "/dashboard/shopee" : "/login";

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href={homeHref} aria-label="Início" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#EE4D2D] text-white font-bold">
              SR
            </span>
            <span className="font-semibold text-gray-900">SeuReview</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2">
            <a
              href={SITE_URL}
              target="_blank"
              rel="noopener"
              className="btn btn-ghost"
            >
              Voltar ao site
            </a>
            {loggedIn ? (
              <>
                <Link href="/dashboard/shopee" className="btn btn-ghost">Painel</Link>
                <button onClick={logout} className="btn btn-primary">Sair</button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost">Entrar</Link>
                <Link href="/signup" className="btn btn-primary">Criar conta</Link>
              </>
            )}
          </div>

          <button
            className="sm:hidden inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menu"
          >
            {open ? "Fechar" : "Menu"}
          </button>
        </div>

        {/* Mobile */}
        {open && (
          <div className="sm:hidden mt-3 border-t pt-3 space-y-2">
            <a
              href={SITE_URL}
              target="_blank"
              rel="noopener"
              className="px-2 py-2 rounded-lg hover:bg-gray-50 text-sm block"
              onClick={() => setOpen(false)}
            >
              Voltar ao site
            </a>
            {loggedIn ? (
              <>
                <Link
                  href="/dashboard/shopee"
                  className="btn btn-ghost w-full"
                  onClick={() => setOpen(false)}
                >
                  Painel
                </Link>
                <button onClick={logout} className="btn btn-primary w-full">
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="btn btn-ghost w-full"
                  onClick={() => setOpen(false)}
                >
                  Entrar
                </Link>
                <Link
                  href="/signup"
                  className="btn btn-primary w-full"
                  onClick={() => setOpen(false)}
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
