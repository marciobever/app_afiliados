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
    <html lang="pt-BR">
      <body className="bg-white text-gray-900 antialiased min-h-screen flex flex-col">
        {children}

        {/* Footer global */}
        <footer className="border-t mt-auto bg-white">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-gray-600 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#EE4D2D] text-white text-xs font-bold">
                SR
              </span>
              <span className="font-medium">SeuReview</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/terms" className="hover:text-gray-800">
                Termos
              </a>
              <a href="/privacy" className="hover:text-gray-800">
                Privacidade
              </a>
              <a
                href="mailto:suporte@seureview.com.br"
                className="hover:text-gray-800"
              >
                Suporte
              </a>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 pb-4">
            © {new Date().getFullYear()} SeuReview. Todos os direitos reservados.
          </p>
        </footer>
      </body>
    </html>
  );
}
