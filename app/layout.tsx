// app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import Header from "@/components/Header";

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
        <main className="min-h-[70vh]">{children}</main>
      </body>
    </html>
  );
}
