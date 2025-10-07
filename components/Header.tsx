"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Props = { initialLoggedIn?: boolean };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://seureview.com.br";

function btnBase(...c: Array<string | false | undefined>) {
  return ["inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm transition-colors", ...c.filter(Boolean)].join(" ");
}
function NavLink({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={btnBase(
        "border",
        active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:bg-gray-50 text-gray-900"
      )}
    >
      {children}
    </Link>
  );
}

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
  const isDash = pathname?.startsWith("/dashboard");
  const isConfig = pathname === "/dashboard/configuracoes";

  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Logo / Home */}
          <Link href={homeHref} aria-label="Início" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#EE4D2D] text-white font-bold">
              SR
            </span>
            <span className="font-semibold text-gray-900">SeuReview</span>
          </Link>

          {/* Ações (desktop) */}
          <div className="hidden sm:flex items-center gap-2">
            <a href={SITE_URL} target="_blank" rel="noopener" className={btnBase("border border-gray-200 hover:bg-gray-50 text-gray-900")}>
              Voltar ao site
            </a>

            {loggedIn ? (
              <>
                <NavLink href="/dashboard" active={isDash && !isConfig}>Painel</NavLink>
                <NavLink href="/dashboard/configuracoes" active={isConfig}>Configurações</NavLink>
                <button onClick={logout} className={btnBase("bg-gray-900 text-white hover:bg-gray-800")}>
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={btnBase("border border-gray-200 hover:bg-gray-50 text-gray-900")}>Entrar</Link>
                <Link href="/signup" className={btnBase("bg-gray-900 text-white hover:bg-gray-800")}>Criar conta</Link>
              </>
            )}
          </div>

          {/* Mobile */}
          <button
            className={btnBase("sm:hidden border border-gray-200 hover:bg-gray-50 text-gray-900")}
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menu"
          >
            {open ? "Fechar" : "Menu"}
          </button>
        </div>

        {/* Menu mobile */}
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
                <Link href="/dashboard" className={btnBase("border border-gray-200 hover:bg-gray-50 text-gray-900")} onClick={() => setOpen(false)}>
                  Painel
                </Link>
                <Link href="/dashboard/configuracoes" className={btnBase("border border-gray-200 hover:bg-gray-50 text-gray-900")} onClick={() => setOpen(false)}>
                  Configurações
                </Link>
                <button onClick={logout} className={btnBase("bg-gray-900 text-white hover:bg-gray-800")}>
                  Sair
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                <Link href="/login" className={btnBase("border border-gray-200 hover:bg-gray-50 text-gray-900")} onClick={() => setOpen(false)}>
                  Entrar
                </Link>
                <Link href="/signup" className={btnBase("bg-gray-900 text-white hover:bg-gray-800")} onClick={() => setOpen(false)}>
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
