// components/Header.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(' ');
}

// checa app_session no client
function hasSessionCookie() {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some(c => c.trim().startsWith('app_session='));
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  // Detecta sessão após montar (e a cada troca de rota a verificação refaz naturalmente)
  useEffect(() => {
    setLoggedIn(hasSessionCookie());
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

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-[#FFD9CF]">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
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

          {/* Ações (direita) */}
          <div className="hidden sm:flex items-center gap-2">
            {loggedIn ? (
              <>
                <Link href="/dashboard/shopee" className="btn btn-ghost">Painel</Link>
                <Link href="/api/auth/logout" className="btn btn-primary">Sair</Link>
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
        <div
          className={cx(
            'md:hidden transition-all overflow-hidden',
            open ? 'max-h-[60vh] mt-3' : 'max-h-0'
          )}
        >
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
                  <Link
                    href="/dashboard/shopee"
                    className="btn btn-ghost w-full"
                    onClick={() => setOpen(false)}
                  >
                    Painel
                  </Link>
                  <Link
                    href="/api/auth/logout"
                    className="btn btn-primary w-full"
                    onClick={() => setOpen(false)}
                  >
                    Sair
                  </Link>
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
          </div>
        </div>
      </div>
    </header>
  );
}
