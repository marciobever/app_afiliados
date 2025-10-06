'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Props = { initialLoggedIn?: boolean };

function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(' ');
}

export default function Header({ initialLoggedIn = false }: Props) {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(initialLoggedIn);

  // 🔎 checa sessão no mount, ao focar a aba e após navegações
  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch('/api/auth/me', { cache: 'no-store' });
        setLoggedIn(r.ok);
      } catch {
        setLoggedIn(false);
      }
    };
    check();
    window.addEventListener('focus', check);
    return () => window.removeEventListener('focus', check);
  }, []);

  const navPublic = [
    { href: '/#como-funciona', label: 'Como funciona' },
    { href: '/#recursos', label: 'Recursos' },
    { href: '/#depoimentos', label: 'Depoimentos' },
    { href: '/#faq', label: 'FAQ' },
  ];

  const navPrivate = [
    { href: '/dashboard/shopee', label: 'Dashboard' },
    { href: '/dashboard/configuracoes', label: 'Configurações' },
  ];

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    // ✅ atualiza UI imediatamente e redireciona
    setLoggedIn(false);
    window.location.href = '/';
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-[#FFD9CF]">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2" aria-label="SeuReview - Início">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#EE4D2D] text-white font-bold">
              SR
            </span>
            <span className="font-semibold text-gray-900">SeuReview</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {navPublic.map((i) => (
              <Link key={i.href} href={i.href} className="hover:text-gray-700">
                {i.label}
              </Link>
            ))}
            {loggedIn &&
              navPrivate.map((i) => (
                <Link key={i.href} href={i.href} className="hover:text-gray-700">
                  {i.label}
                </Link>
              ))}
          </nav>

          {/* Actions (right) */}
          <div className="hidden sm:flex items-center gap-2">
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

          {/* Mobile menu button */}
          <button
            className="md:hidden inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menu"
          >
            {open ? 'Fechar' : 'Menu'}
          </button>
        </div>

        {/* Mobile nav */}
        <div className={cx('md:hidden transition-all overflow-hidden', open ? 'max-h-[60vh] mt-3' : 'max-h-0')}>
          <div className="flex flex-col gap-2 border-t pt-3">
            {[...navPublic, ...(loggedIn ? navPrivate : [])].map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className="px-2 py-2 rounded-lg hover:bg-gray-50 text-sm"
                onClick={() => setOpen(false)}
              >
                {i.label}
              </Link>
            ))}

            <div className="flex items-center gap-2 pt-2">
              {loggedIn ? (
                <>
                  <Link href="/dashboard/shopee" className="btn btn-ghost w-full" onClick={() => setOpen(false)}>
                    Painel
                  </Link>
                  <button onClick={logout} className="btn btn-primary w-full">
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn btn-ghost w-full" onClick={() => setOpen(false)}>
                    Entrar
                  </Link>
                  <Link href="/signup" className="btn btn-primary w-full" onClick={() => setOpen(false)}>
                    Criar conta
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
