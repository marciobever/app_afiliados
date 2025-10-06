
// components/Newsletter.tsx
"use client";

import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState<null | boolean>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const r = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setOk(r.ok);
      if (r.ok) setEmail("");
    } catch {
      setOk(false);
    } finally {
      setLoading(false);
      setTimeout(() => setOk(null), 3000);
    }
  }

  return (
    <section className="mt-14 rounded-2xl border bg-white p-6 md:p-8">
      <div className="grid md:grid-cols-2 gap-6 items-center">
        <div>
          <h3 className="text-xl md:text-2xl font-bold">Receba novidades e oportunidades</h3>
          <p className="mt-2 text-sm text-gray-600">
            Dicas rápidas de produtos quentes e melhorias do SeuReview, direto no seu e-mail.
          </p>
        </div>
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            type="email"
            placeholder="seuemail@exemplo.com"
            className="flex-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className="btn btn-primary" disabled={!email || loading}>
            {loading ? "Enviando..." : "Quero receber"}
          </button>
        </form>
      </div>
      {ok === true && (
        <p className="mt-3 text-sm text-green-600">Pronto! Você está na lista. 🎉</p>
      )}
      {ok === false && (
        <p className="mt-3 text-sm text-red-600">
          Ops, não conseguimos cadastrar agora. Tente novamente.
        </p>
      )}
    </section>
  );
}
