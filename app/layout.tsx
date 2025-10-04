import "./globals.css";
import Link from "next/link";
import BlockerCheck from "@/components/BlockerCheck";

export const metadata = {
  title: "Afiliados",
  description: "Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#FFF4F0] text-[#111827] antialiased">
        {/* Verificação de bloqueador de conteúdo */}
        <BlockerCheck />

        {/* Topbar / Menu */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-[#FFD9CF]">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#EE4D2D] text-white font-bold">
                A
              </span>
              <span className="font-semibold">Afiliados</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Link
                href="/dashboard/shopee"
                className="px-3 py-1.5 rounded-lg border border-[#FFD9CF] hover:bg-[#FFF4F0]"
              >
                Shopee
              </Link>
              <Link
                href="/dashboard/configuracoes"
                className="px-3 py-1.5 rounded-lg bg-[#EE4D2D] hover:bg-[#D8431F] text-white"
              >
                Configurações
              </Link>
            </div>
          </nav>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
