// app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import Header from "@/components/Header";
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
        <Header initialLoggedIn={hasSession} />

        <main className="min-h-[70vh] mx-auto max-w-7xl px-4 py-8 bg-gradient-to-b from-white to-[#fff7f5] rounded-2xl">
          {children}
        </main>

        <footer className="border-t mt-10">
          <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-gray-600">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <a
                href="https://seureview.com.br"
                className="flex items-center gap-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Logo size={24} withText />
              </a>
              <nav className="flex items-center gap-4">
                <a href="https://seureview.com.br/privacidade" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">Privacidade</a>
                <a href="https://seureview.com.br/termos" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">Termos</a>
                <a href="https://seureview.com.br/exclusao-de-dados" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">Exclusão de dados</a>
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
