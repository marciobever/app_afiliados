"use client";

import { useEffect } from "react";

export default function BlockerCheck() {
  useEffect(() => {
    async function checkBlockers() {
      if (typeof window === "undefined") return;

      try {
        const res = await fetch("/api/health", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) throw new Error("blocked");
      } catch {
        if (process.env.NODE_ENV === "production") {
          alert(
            "⚠️ Parece que você está usando um bloqueador de conteúdo. Desative-o para usar todas as funções do site."
          );
        }
      }
    }

    checkBlockers();
  }, []);

  return null;
}
