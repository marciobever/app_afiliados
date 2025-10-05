// app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "SeuReview",
  description: "Automação para afiliados (Shopee + IG/FB)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      {/* NÃO defina bg/text aqui para não “sujar” os sub-layouts */}
      <body className="antialiased">{children}</body>
    </html>
  );
}
