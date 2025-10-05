// app/layout.tsx
import "./globals.css";

export const metadata = { title: "SeuReview", description: "Automação para afiliados" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-white text-gray-900">{children}</body>
    </html>
  );
}
