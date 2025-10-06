// app/layout.tsx
import "./globals.css";
import Link from "next/link";
import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import Logo from "@/components/Logo";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SeuReview",
  description: "Automação de afiliados para marketplaces e redes sociais",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Lê o cookie httpOnly no server
  const hasSession = cookies().has("app_session");

  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-white text-gray-900 antialiased`}>
        {/* HEADER ÚNICO (client) */}
        <Header initialLoggedIn={hasSession} />

        {/* CONTEÚDO */}
        <main className="mx-auto max-w-7xl px-4 py-10">{children}</main>

        {/* FOOTER ÚNICO */}
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
