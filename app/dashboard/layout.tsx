// app/dashboard/layout.tsx
import Sidebar from "@/components/Sidebar";
import React from "react";

export const metadata = {
  title: "SeuReview — Dashboard",
};

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#0B0B10] text-white">
      {/* Background neon */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-80"
        style={{
          background:
            "radial-gradient(900px 520px at 12% -10%, rgba(238,77,45,0.20) 0%, transparent 60%)," +
            "radial-gradient(750px 480px at 90% -5%, rgba(167,139,250,0.18) 0%, transparent 62%)," +
            "radial-gradient(560px 420px at 50% 105%, rgba(34,197,94,0.12) 0%, transparent 60%)",
        }}
      />

      <div className="mx-auto flex max-w-7xl gap-6 p-4 md:p-6">
        {/* Sidebar fixa (oculta no mobile por enquanto) */}
        <aside className="sticky top-4 hidden h-[calc(100dvh-2rem)] w-[260px] md:block">
          <Sidebar />
        </aside>

        {/* Main em “glass” suave + spacing padrão */}
        <main className="flex-1">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
