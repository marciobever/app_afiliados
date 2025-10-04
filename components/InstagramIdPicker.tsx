"use client";

import { useState } from "react";

type PageItem = {
  page_id: string;
  page_name: string;
  ig_user_id: string | null;
  ig_username: string | null;
};

export default function InstagramIdPicker({
  value,
  onChange,
  onUsernameChange,
}: {
  value: string;                              // IG Business ID atual do form
  onChange: (id: string) => void;             // atualiza IG Business ID
  onUsernameChange?: (u: string | null) => void; // opcional: atualiza @username
}) {
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState<PageItem[] | null>(null);
  const [selected, setSelected] = useState<string>(""); // page_id

  async function carregarContas() {
    setLoading(true);
    try {
      const r = await fetch("/api/meta/pages", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) {
        const msg =
          j?.error === "meta_not_connected"
            ? "Conecte sua conta Meta antes (botão Conectar Meta)."
            : (j?.error || "Falha ao buscar contas do Instagram");
        alert(msg);
        setPages(null);
      } else {
        setPages(j.pages || []);
      }
    } catch (e: any) {
      alert(e?.message || "Erro de rede");
      setPages(null);
    } finally {
      setLoading(false);
    }
  }

  function aplicarSelecionado() {
    if (!pages) return;
    const p = pages.find((x) => x.page_id === selected);
    if (!p) return;
    if (!p.ig_user_id) {
      alert("Esta página não possui Instagram Business vinculado.");
      return;
    }
    onChange(p.ig_user_id);
    onUsernameChange?.(p.ig_username ?? null);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          className="px-3 py-2 rounded-lg bg-[#1877F2] hover:bg-[#145DBF] text-white text-sm"
          onClick={carregarContas}
          disabled={loading}
        >
          {loading ? "Buscando..." : "Buscar minhas contas do Instagram"}
        </button>

        {pages && pages.length > 0 ? (
          <>
            <select
              className="border border-[#FFD9CF] rounded-lg px-3 py-2 text-sm"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Selecione uma página…</option>
              {pages.map((p) => (
                <option key={p.page_id} value={p.page_id}>
                  {p.page_name}
                  {p.ig_username ? ` — @${p.ig_username}` : ""}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="px-3 py-2 rounded-lg border border-[#FFD9CF] hover:bg-[#FFF4F0] text-sm"
              onClick={aplicarSelecionado}
            >
              Usar este IG
            </button>
          </>
        ) : null}
      </div>

      {/* Campo preenchido automaticamente */}
      <input
        className="border border-[#FFD9CF] rounded-lg px-3 py-2 w-full"
        placeholder="Instagram Business ID"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
