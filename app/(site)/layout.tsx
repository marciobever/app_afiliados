import "../globals.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SeuReview — Afiliados inteligentes para Shopee, Instagram e Facebook",
  description:
    "Automatize sua operação de afiliados com IA, SubIDs e publicação direta via n8n (Meta Graph API).",
  openGraph: {
    title: "SeuReview — Afiliados inteligentes",
    description:
      "Descubra produtos, gere legendas com IA e publique direto no Instagram e Facebook.",
    url: "https://seureview.com.br",
    siteName: "SeuReview",
    images: [
      {
        url: "https://seureview.com.br/og-cover.png",
        width: 1200,
        height: 630,
        alt: "SeuReview — Afiliados inteligentes",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body className="bg-white text-gray-900 dark:bg-[#0b0b0b] dark:text-gray-100 antialiased min-h-screen flex flex-col transition-colors duration-300">
        {children}

        {/* Footer global */}
        <footer className="border-t border-gray-100 dark:border-gray-800 mt-auto bg-white/60 dark:bg-black/60 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-gray-600 dark:text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#EE4D2D] text-white text-xs font-bold shadow-sm">
                SR
              </span>
              <span className="font-medium">SeuReview</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/terms" className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                Termos
              </a>
              <a href="/privacy" className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                Privacidade
              </a>
              <a
                href="mailto:suporte@seureview.com.br"
                className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Suporte
              </a>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 dark:text-gray-600 pb-4">
            © {new Date().getFullYear()} SeuReview. Todos os direitos reservados.
          </p>
        </footer>
      </body>
    </html>
  );
}
