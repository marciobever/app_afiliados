// app/layout.tsx
import "./globals.css";
import Link from "next/link";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import Logo from "@/components/Logo";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SeuReview — App",
  description: "Automação de afiliados para marketplaces e redes sociais.",
  metadataBase: new URL("https://app.seureview.com.br"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const hasSession = cookies().has("app_session");

  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-white text-gray-900 antialiased`}>
        {/* Topbar mínima do APP */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
            <Link href={hasSession ? "/dashboard" : "/login"} aria-label="Início">
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#EE4D2D] text-white font-bold">
                  SR
                </span>
                <span className="font-semibold text-gray-900">SeuReview</span>
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <a
                href="https://seureview.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
              >
                Voltar ao site
              </a>

              {hasSession ? (
                <form action="/api/auth/logout" method="POST">
                  <button type="submit" className="btn btn-primary">Sair</button>
                </form>
              ) : (
                <>
                  <Link href="/login" className="btn btn-ghost">Entrar</Link>
                  <Link href="/signup" className="btn btn-primary">Criar conta</Link>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="min-h-[70vh]">{children}</main>

        <footer className="border-t mt-10">
          <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-gray-600">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <a href="https://seureview.com.br" className="flex items-center gap-2" target="_blank" rel="noopener noreferrer">
                <Logo size={24} withText />
              </a>
              <nav className="flex items-center gap-4">
                <a href="https://seureview.com.br/privacidade" className="hover:text-gray-900" target="_blank" rel="noopener noreferrer">Privacidade</a>
                <a href="https://seureview.com.br/termos" className="hover:text-gray-900" target="_blank" rel="noopener noreferrer">Termos</a>
                <a href="https://seureview.com.br/exclusao-de-dados" className="hover:text-gray-900" target="_blank" rel="noopener noreferrer">Exclusão de dados</a>
                <a href="mailto:suporte@seureview.com.br" className="hover:text-gray-900">Suporte</a>
              </nav>
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
