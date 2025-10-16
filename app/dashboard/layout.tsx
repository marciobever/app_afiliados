// app/dashboard/layout.tsx
import React from "react";
import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "SeuReview — Dashboard",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-4 md:py-6">
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        {/* Sidebar (light) */}
        <aside className="hidden md:block">
          <Sidebar />
        </aside>

        {/* Conteúdo */}
        <main>{children}</main>
      </div>
    </div>
  );
}
