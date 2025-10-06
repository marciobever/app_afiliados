// app/layout.tsx
import "./globals.css";
import Link from "next/link";
import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import Logo from "@/components/logo"; // <- atenção ao case

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SeuReview",
  description: "Automação de afiliados para marketplaces e redes sociais",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const hasSession = cookies().has("app_session");

  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-white text-gray-900 antialiased`}>
        {/* NAVBAR GLOBAL */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
          <div className="mx-auto max-w-7xl px-4">
            <div className="h-14 flex items-center justify-between gap-4">
              <Link href="/" className="shrink-0" aria-label="Ir para início">
                <Logo />
              </Link>

              <nav className="hidden md:flex items-center gap-1 text-sm">
                <Link className="nav-item" href="/">Início</Link>
                {hasSession && (
                  <>
                    <Link className="nav-item" href="/dashboard/shopee">Dashboard</Link>
                    <Link className="nav-item" href="/dashboard/configuracoes">Configurações</Link>
                  </>
                )}
                <Link className="nav-item" href="/#como-funciona">Como funciona</Link>
                <Link className="nav-item" href="/#recursos">Recursos</Link>
                <Link className="nav-item" href="/#depoimentos">Depoimentos</Link>
              </nav>

              <div className="flex items-center gap-2">
                {hasSession ? (
                  <Link href="/dashboard/shopee" className="btn btn-primary">
                    Abrir painel
                  </Link>
                ) : (
                  <>
                    <Link href="/login" className="btn btn-ghost">Entrar</Link>
                    <Link href="/signup" className="btn btn-primary">Criar conta</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* CONTEÚDO */}
        <main className="mx-auto max-w-7xl px-4 py-10">{children}</main>

        {/* FOOTER GLOBAL */}
        <footer className="border-t mt-10">
          <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-gray-600">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Logo size={24} withText />
              <div className="flex items-center gap-4">
                <Link href="/terms" className="hover:text-gray-900">Termos</Link>
                <Link href="/privacy" className="hover:text-gray-900">Privacidade</Link>
                <a href="mailto:suporte@seureview.com.br" className="hover:text-gray-900">Suporte</a>
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
