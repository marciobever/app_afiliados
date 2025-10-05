// app/layout.tsx
import "./globals.css";
import Link from "next/link";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SeuReview",
  description: "Automação de afiliados: Shopee + Instagram/Facebook",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-white text-gray-900 antialiased`}>
        {/* Header global */}
        <header className="sticky top-0 z-40 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#EE4D2D] text-white font-bold">
                SR
              </span>
              <span className="font-semibold">SeuReview</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link href="/" className="nav-link">Início</Link>
              <Link href="/dashboard/shopee" className="nav-link">Dashboard</Link>
              <Link href="/dashboard/configuracoes" className="nav-link">Configurações</Link>
            </nav>

            <div className="flex items-center gap-2">
              <Link href="/login" className="btn btn-ghost">Entrar</Link>
              <Link href="/signup" className="btn btn-primary">Criar conta</Link>
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <main className="mx-auto max-w-7xl px-4 py-6">
          {children}
        </main>

        {/* Footer global */}
        <footer className="border-t">
          <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-gray-600">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#EE4D2D] text-white text-xs font-bold">
                  SR
                </span>
                <span>SeuReview</span>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/terms" className="hover:text-gray-800">Termos</Link>
                <Link href="/privacy" className="hover:text-gray-800">Privacidade</Link>
                <a href="mailto:suporte@seureview.com.br" className="hover:text-gray-800">Suporte</a>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-400">
              © {new Date().getFullYear()} SeuReview. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
