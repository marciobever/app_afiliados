'use client';

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// (opcional) evita tentativas de pré-render estático dessa página
export const dynamic = 'force-dynamic';

function LoginForm() {
  const [email, setEmail] = useState("marciobevervanso");
  const [password, setPassword] = useState("102030");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/dashboard/shopee";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha no login");
      router.push(next);
    } catch (e:any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-[#FFF4F0] px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white border border-[#FFD9CF] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#EE4D2D] text-white font-bold">A</span>
          <h1 className="text-lg font-semibold">Entrar</h1>
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <div className="space-y-1">
          <label className="text-sm">E-mail (login)</label>
          <input
            className="w-full border border-[#FFD9CF] rounded-lg px-3 py-2"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            placeholder="seu email"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Senha</label>
          <input
            className="w-full border border-[#FFD9CF] rounded-lg px-3 py-2"
            type="password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
          />
        </div>
        <button
          disabled={loading}
          className="w-full px-4 py-2 rounded-lg bg-[#EE4D2D] hover:bg-[#D8431F] text-white"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}

// Wrapper com Suspense para permitir useSearchParams
export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen grid place-items-center bg-[#FFF4F0] px-4">
      <div className="text-sm text-[#6B7280]">Carregando…</div>
    </main>}>
      <LoginForm />
    </Suspense>
  );
}