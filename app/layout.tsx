// app/layout.tsx
import "./globals.css";
import Link from "next/link";
import { Inter } from "next/font/google";
import Logo from "@/components/Logo";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata = {
  title: "SeuReview — Automação para Afiliados",
  description:
    "Descubra produtos e publique no Instagram/Facebook com IA e tracking. Suporte a Shopee, Amazon, Mercado Livre, AliExpress, Temu e mais.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body
        className={`${inter.className} bg-white text-gray-900 antialiased min-h-screen flex flex-col`}
      >
        {/* 🔹 HEADER GLOBAL */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
          <div className="mx-auto max-w-7xl px-4">
            <div className="h-16 flex items-center justify-between gap-4">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 shrink-0">
                <Logo />
                <span className="font-semibold text-lg text-gray-800 hidden sm:inline">
                  SeuReview
                </span>
              </Link>

              {/* Navegação */}
              <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-700">
                <Link href="/" className="nav-item">
                  Início
                </Link>
                <Link href="/dashboard" className="nav-item">
                  Dashboard
                </Link>
                <Link href="/dashboard/configuracoes" className="nav-item">
                  Configurações
                </Link>
              </nav>

              {/* Botões */}
              <div className="flex items-center gap-2">
                <Link href="/login" className="btn btn-ghost">
                  Entrar
                </Link>
                <Link href="/signup" className="btn btn-primary">
                  Criar conta
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* 🔸 CONTEÚDO PRINCIPAL */}
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-10">
          {children}
        </main>

        {/* 🔹 FOOTER GLOBAL */}
        <footer className="border-t border-gray-100 mt-10 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-gray-600">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Logo size={24} />
                <span className="font-medium text-gray-700">SeuReview</span>
              </div>

              <div className="flex items-center gap-4">
                <Link href="/terms" className="hover:text-gray-900">
                  Termos
                </Link>
                <Link href="/privacy" className="hover:text-gray-900">
                  Privacidade
                </Link>
                <a
                  href="mailto:suporte@seureview.com.br"
                  className="hover:text-gray-900"
                >
                  Suporte
                </a>
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-400">
              © {new Date().getFullYear()} SeuReview. Todos os direitos
              reservados.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
