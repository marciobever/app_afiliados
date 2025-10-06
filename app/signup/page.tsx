'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "Erro no cadastro");
      // já cria sessão -> redireciona
      router.push("/dashboard/shopee");
    } catch (e: any) {
      setErr(e?.message || "Falha ao cadastrar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold">Criar conta</h1>
      <p className="mt-2 text-sm text-gray-600">
        Cadastre-se para começar a descobrir produtos e publicar com 1 clique.
      </p>

      {err && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Nome</label>
          <input
            className="w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">E-mail</label>
          <input
            type="email"
            className="w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Senha</label>
          <input
            type="password"
            className="w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            minLength={6}
            required
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="btn btn-primary w-full"
        >
          {busy ? "Enviando..." : "Criar conta"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Já tem conta?{" "}
          <a href="/login" className="underline underline-offset-2">
            Entrar
          </a>
        </p>
      </form>
    </main>
  );
}
