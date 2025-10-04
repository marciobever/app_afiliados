"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ImageIcon,
  PlayCircle,
  Type,
  Wand2,
  ShoppingCart,
  Laugh,
  Filter,
  Instagram,
  Clock,
  Copy,
  Check,
} from "lucide-react";
import { buildInstagramCaption } from "@/utils/captions";
import FeedMock from "@/components/FeedMock"; // <- IMPORTANTE

/**
 * Shopee Dashboard — Theme on-brand (Shopee)
 * Cores: primária #EE4D2D | hover #D8431F | acento #FF6A3C | fundo #FFF4F0 | borda #FFD9CF
 */

// Tabs simples
function Tabs({
  value,
  onChange,
  tabs,
}: {
  value: string;
  onChange: (v: string) => void;
  tabs: { key: string; label: string }[];
}) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-4 w-full md:w-[720px] rounded-xl overflow-hidden border border-[#FFD9CF] bg-white">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={[
              "px-4 py-2 text-sm font-medium border-r last:border-r-0 transition-colors",
              "border-[#FFD9CF]",
              value === t.key
                ? "bg-[#EE4D2D] text-white"
                : "bg-white text-[#111827] hover:bg-[#FFF4F0]",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Separator() {
  return <div className="h-px w-full bg-[#FFD9CF]" />;
}

// Card “terminal” do produto
function TerminalCard({
  product,
  selected,
  onOpen,
  onToggleSelect,
}: {
  product: {
    id: string;
    title: string;
    price: number;
    rating: string | number;
    image: string;
    url: string;
  };
  selected?: boolean;
  onOpen: () => void;
  onToggleSelect: () => void;
}) {
  return (
    <aside
      className={[
        "bg-black text-white p-4 rounded-xl w-full font-mono shadow-sm border",
        "transition-all duration-200",
        selected ? "ring-2 ring-[#EE4D2D] border-[#2a2a2a]" : "border-[#2a2a2a]",
      ].join(" ")}
      style={{ boxShadow: "0 2px 0 rgba(0,0,0,0.05)" }}
    >
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <p className="text-sm text-gray-400">shopee-cli</p>
      </div>

      <div className="mt-4 space-y-3">
        <div className="aspect-[4/3] bg-[#0f0f0f] rounded-lg overflow-hidden border border-[#1f1f1f]">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="space-y-1">
          <p className="text-[#FF6A3C]">$ {product.title}</p>
          <p className="text-gray-300">
            <span className="text-amber-300">★</span> {product.rating} — R{"$ "}
            {Number(product.price ?? 0).toFixed(2)}
          </p>
          <p className="text-gray-500 text-xs"># {product.id}</p>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            className="px-3 py-1.5 rounded text-sm border border-[#343434] bg-[#1a1a1a] hover:bg-[#232323]"
            onClick={onOpen}
          >
            Abrir
          </button>
          <button
            className={[
              "px-3 py-1.5 rounded text-sm border transition-colors",
              selected
                ? "bg-[#EE4D2D] hover:bg-[#D8431F] text-white border-[#EE4D2D]"
                : "bg-[#10B981] hover:bg-[#0EA371] text-white border-[#0EA371]",
            ].join(" ")}
            onClick={onToggleSelect}
          >
            {selected ? "Selecionado" : "Selecionar"}
          </button>
        </div>
      </div>
    </aside>
  );
}

type ApiItem = {
  id: string;
  title: string;
  price: number;
  rating: number;
  image: string;
  url: string;
};

export default function ShopeeDashboard() {
  const [tab, setTab] = useState("produtos");

  // filtros / busca
  const [query, setQuery] = useState("");
  const [onlyPromo, setOnlyPromo] = useState(false);
  const [minRating, setMinRating] = useState(0);

  // dados reais
  const [items, setItems] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // seleção
  const [selected, setSelected] = useState<string[]>([]);

  // ----- Designer (Feed) -----
  const [style, setStyle] = useState<"Minimal" | "Promo" | "Dark" | "Vibrante" | "Clean">(
    "Minimal"
  );
  const [igKeyword, setIgKeyword] = useState("oferta");

  // IG variants
  const [igVariants, setIgVariants] = useState<
    { hook: string; body: string; cta_lines: string[]; hashtags: string[] }[]
  >([]);
  const [igIndex, setIgIndex] = useState(0);

  // FB variants
  const [fbVariants, setFbVariants] = useState<
    { title: string; intro: string; bullets: string[]; cta: string; hashtags: string[] }[]
  >([]);
  const [fbIndex, setFbIndex] = useState(0);

  const [genErr, setGenErr] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState<null | "ig" | "fb" | "mock">(null);

  // buscar produtos — somente quando clicar (sem auto-busca)
  async function runSearch() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/search/shopee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query || "liquidificador",
          filters: { limit: 24, onlyPromo, minRating },
          sort: "relevance",
          country: "BR",
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e: any) {
      setErr(e?.message || "Erro ao buscar");
    } finally {
      setLoading(false);
    }
  }

  // filtra no client
  const filtered = useMemo(() => {
    let out = items.slice();
    if (onlyPromo) {
      out = out.filter(
        (p: any) =>
          Array.isArray((p as any).tags) && (p as any).tags.includes("promo")
      );
    }
    if (minRating > 0) {
      out = out.filter((p) => Number(p.rating || 0) >= minRating);
    }
    const q = query.trim().toLowerCase();
    if (q) out = out.filter((p) => p.title.toLowerCase().includes(q));
    return out;
  }, [items, query, onlyPromo, minRating]);

  function toggleSelect(id: string) {
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );
  }

  const selectedProducts = useMemo(
    () => filtered.filter((p) => selected.includes(p.id)),
    [filtered, selected]
  );

  function compactProducts() {
    return selectedProducts.slice(0, 8).map((p) => ({
      id: String(p.id),
      title: p.title,
      price: Number(p.price ?? 0),
      rating: Number(p.rating ?? 0),
      url: (p as any).url,
      image: (p as any).image,
    }));
  }

  async function callCaption(kind: "instagram_caption" | "facebook_caption", extra: any = {}) {
    const res = await fetch("/api/caption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        style,
        products: compactProducts(),
        ...extra,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Falha na geração");
    return data;
  }

  // IG
  async function generateInstagramCaption() {
    if (!selectedProducts.length) {
      setGenErr("Selecione pelo menos 1 produto.");
      return;
    }
    setGenErr(null);
    setGenLoading("ig");
    try {
      const data = await callCaption("instagram_caption", { keyword: igKeyword });
      const variants =
        Array.isArray(data) ? data?.[0]?.variants : data?.variants;
      if (!Array.isArray(variants)) throw new Error("Resposta inválida do n8n (variants)");
      setIgVariants(variants);
      setIgIndex(0);
    } catch (e: any) {
      setGenErr(e?.message || "Erro ao gerar caption do Instagram");
    } finally {
      setGenLoading(null);
    }
  }

  // FB
  async function generateFacebookCaption() {
    if (!selectedProducts.length) {
      setGenErr("Selecione pelo menos 1 produto.");
      return;
    }
    setGenErr(null);
    setGenLoading("fb");
    try {
      const data = await callCaption("facebook_caption");
      const variants =
        Array.isArray(data) ? data?.[0]?.variants : data?.variants;
      if (!Array.isArray(variants)) throw new Error("Resposta inválida do n8n (variants)");
      setFbVariants(variants);
      setFbIndex(0);
    } catch (e: any) {
      setGenErr(e?.message || "Erro ao gerar caption do Facebook");
    } finally {
      setGenLoading(null);
    }
  }

  // (por enquanto) mock local usa imagens dos produtos selecionados via <FeedMock/>
  async function generateFeedMock() {
    if (!selectedProducts.length) {
      setGenErr("Selecione pelo menos 1 produto.");
      return;
    }
    // nada assíncrono aqui — o mock já renderiza com base em selectedProducts
    setGenErr(null);
  }

  // copy helper
  function CopyButton({ text }: { text: string }) {
    const [ok, setOk] = useState(false);
    return (
      <button
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#FFD9CF] hover:bg-[#FFF4F0] text-sm"
        onClick={async () => {
          await navigator.clipboard.writeText(text || "");
          setOk(true);
          setTimeout(() => setOk(false), 1200);
        }}
      >
        {ok ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {ok ? "Copiado" : "Copiar"}
      </button>
    );
  }

  // IG caption atual (render)
  const igCaptionText = useMemo(() => {
    if (!igVariants.length) return "";
    const v = igVariants[Math.max(0, Math.min(igIndex, igVariants.length - 1))];
    return buildInstagramCaption(v);
  }, [igVariants, igIndex]);

  // FB caption atual (render)
  const fbCaptionText = useMemo(() => {
    if (!fbVariants.length) return "";
    const v = fbVariants[Math.max(0, Math.min(fbIndex, fbVariants.length - 1))];
    const blocks = [
      v.title?.trim(),
      v.intro?.trim(),
      (v.bullets || []).map((b) => `• ${b}`).join("\n").trim(),
      v.cta?.trim(),
      (v.hashtags || []).join(" ").trim(),
    ]
      .filter(Boolean)
      .join("\n\n");
    return blocks;
  }, [fbVariants, fbIndex]);

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-[#111827]">
          <ShoppingCart className="w-6 h-6 text-[#EE4D2D]" /> Shopee — Painel de Conteúdo
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Curadoria de produtos → criação de assets para Facebook/Instagram (feed), Reels e Tirinhas.
        </p>
      </motion.div>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { key: "produtos", label: "Produtos" },
          { key: "designer", label: "Designer (Feed)" },
          { key: "reels", label: "Reels" },
          { key: "tirinhas", label: "Tirinhas" },
        ]}
      />

      {/* PRODUTOS */}
      {tab === "produtos" && (
        <section className="space-y-4">
          {/* Filtro */}
          <div className="rounded-xl border border-dashed border-[#FFD9CF] bg-white">
            <div className="p-4 border-b border-[#FFD9CF] flex items-center justify-between">
              <h2 className="text-base font-semibold flex items-center gap-2 text-[#111827]">
                <Filter className="w-5 h-5 text-[#EE4D2D]" /> Filtrar/Buscar
              </h2>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1.5 rounded-lg bg-[#EE4D2D] hover:bg-[#D8431F] text-white text-sm"
                  onClick={runSearch}
                  disabled={loading}
                >
                  {loading ? "Buscando..." : "Buscar"}
                </button>
              </div>
            </div>
            <div className="p-4 grid md:grid-cols-3 gap-3">
              <input
                className="border border-[#FFD9CF] rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D]"
                placeholder="Buscar por título…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") runSearch();
                }}
              />
              <label className="flex items-center gap-2 text-sm text-[#374151]">
                <input
                  type="checkbox"
                  checked={onlyPromo}
                  onChange={(e) => setOnlyPromo(e.target.checked)}
                  className="w-4 h-4 rounded border-[#FFD9CF] text-[#EE4D2D] focus:ring-[#EE4D2D]"
                />
                Apenas promoções
              </label>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-[#6B7280]">Avaliações mín.</span>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={0.5}
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="w-full accent-[#EE4D2D]"
                />
                <span className="text-[#111827] font-medium">{minRating.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Estado de erro */}
          {err && (
            <div className="p-3 rounded-lg border border-[#FFD9CF] bg-[#FFF4F0] text-[#B42318] text-sm">
              {err}
            </div>
          )}

          {/* Mensagem inicial sem busca */}
          {!loading && !err && items.length === 0 && (
            <div className="p-4 rounded-lg border border-[#FFD9CF] bg-white text-sm text-[#6B7280]">
              Faça uma busca para listar produtos.
            </div>
          )}

          {/* Grid */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <motion.div key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <TerminalCard
                  product={{
                    id: String(p.id),
                    title: p.title,
                    price: Number(p.price ?? 0),
                    rating: Number(p.rating ?? 0).toFixed(1),
                    image: p.image,
                    url: (p as any).url,
                  }}
                  selected={selected.includes(String(p.id))}
                  onOpen={() => window.open((p as any).url, "_blank")}
                  onToggleSelect={() => toggleSelect(String(p.id))}
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* DESIGNER (Feed) */}
      {tab === "designer" && (
        <section className="space-y-4">
          <div className="rounded-xl border border-[#FFD9CF] bg-white">
            <div className="p-4 border-b border-[#FFD9CF]">
              <h2 className="text-base font-semibold flex items-center gap-2 text-[#111827]">
                <Instagram className="w-5 h-5 text-[#EE4D2D]" /> Template de Post (Feed)
              </h2>
            </div>

            {genErr && (
              <div className="mx-4 mt-4 p-3 rounded-lg border border-[#FFD9CF] bg-[#FFF4F0] text-[#B42318] text-sm">
                {genErr}
              </div>
            )}

            <div className="p-4 grid lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                {/* Seleção */}
                <label className="text-sm font-medium text-[#374151]">Seleção (Produtos)</label>
                <div className="flex flex-wrap gap-2">
                  {selectedProducts.length ? (
                    selectedProducts.map((sp) => (
                      <span
                        key={sp.id}
                        className="inline-flex items-center rounded-full border border-[#FFD9CF] px-2 py-0.5 text-xs bg-[#FFF4F0] text-[#EE4D2D]"
                      >
                        {sp.title.slice(0, 24)}…
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-[#6B7280]">
                      Nenhum produto selecionado (marque na aba Produtos)
                    </span>
                  )}
                </div>

                <Separator />

                {/* estilo */}
                <label className="text-sm font-medium text-[#374151]">Estilo</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Minimal", "Promo", "Dark", "Vibrante", "Clean"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={[
                        "px-3 py-1.5 border rounded-lg text-sm flex items-center gap-2 hover:bg-[#FFF4F0]",
                        "border-[#FFD9CF]",
                        style === s ? "bg-[#FFF4F0]" : "bg-white",
                      ].join(" ")}
                    >
                      <Wand2 className="w-4 h-4 text-[#EE4D2D]" />
                      {s}
                    </button>
                  ))}
                </div>

                {/* Instagram */}
                <div className="mt-2 space-y-2">
                  <label className="text-sm font-medium text-[#374151]">
                    Instagram — palavra do comentário (CTA)
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={igKeyword}
                      onChange={(e) => setIgKeyword(e.target.value)}
                      className="border border-[#FFD9CF] rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D]"
                      placeholder='Ex.: oferta, QUERO, "link", cupom…'
                    />
                    <button
                      onClick={generateInstagramCaption}
                      disabled={genLoading === "ig"}
                      className="px-4 py-2 rounded-lg bg-[#EE4D2D] hover:bg-[#D8431F] text-white whitespace-nowrap"
                    >
                      {genLoading === "ig" ? "Gerando…" : "Gerar IG"}
                    </button>
                  </div>

                  {/* seletor de variações IG */}
                  {!!igVariants.length && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-[#6B7280]">Variação:</span>
                      <select
                        value={igIndex}
                        onChange={(e) => setIgIndex(Number(e.target.value))}
                        className="border border-[#FFD9CF] rounded px-2 py-1"
                      >
                        {igVariants.map((_, i) => (
                          <option key={i} value={i}>
                            {i + 1} / {igVariants.length}
                          </option>
                        ))}
                      </select>
                      <CopyButton text={igCaptionText} />
                    </div>
                  )}

                  <textarea
                    value={igCaptionText}
                    onChange={() => {}}
                    readOnly
                    rows={Math.min(14, Math.max(6, igCaptionText.split("\n").length))}
                    className="w-full border border-[#FFD9CF] rounded-lg p-2 focus:outline-none"
                    placeholder={`Legenda Instagram com CTA "comente \"${igKeyword}\" que te envio o link!" — gere para preencher`}
                  />
                </div>

                {/* Facebook */}
                <div className="mt-2 space-y-2">
                  <label className="text-sm font-medium text-[#374151]">Facebook — legenda estruturada</label>
                  <div className="flex gap-2">
                    <button
                      onClick={generateFacebookCaption}
                      disabled={genLoading === "fb"}
                      className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#272b33] text-white"
                    >
                      {genLoading === "fb" ? "Gerando…" : "Gerar Facebook"}
                    </button>
                    {!!fbVariants.length && (
                      <>
                        <span className="text-sm text-[#6B7280] self-center">Variação:</span>
                        <select
                          value={fbIndex}
                          onChange={(e) => setFbIndex(Number(e.target.value))}
                          className="border border-[#FFD9CF] rounded px-2 py-1"
                        >
                          {fbVariants.map((_, i) => (
                            <option key={i} value={i}>
                              {i + 1} / {fbVariants.length}
                            </option>
                          ))}
                        </select>
                        <CopyButton text={fbCaptionText} />
                      </>
                    )}
                  </div>
                  <textarea
                    value={fbCaptionText}
                    readOnly
                    rows={Math.min(16, Math.max(8, fbCaptionText.split("\n").length))}
                    className="w-full border border-[#FFD9CF] rounded-lg p-2 focus:outline-none"
                    placeholder={`Legenda Facebook (título, intro, bullets, CTA, hashtags) — gere para preencher`}
                  />
                </div>

                {/* ações */}
                <div className="flex gap-2 pt-1">
                  <button
                    className="px-4 py-2 rounded-lg bg-[#EE4D2D] hover:bg-[#D8431F] text-white"
                    onClick={generateFeedMock}
                    disabled={genLoading === "mock"}
                  >
                    {genLoading === "mock" ? "Gerando mock…" : "Gerar mock"}
                  </button>
                </div>
              </div>

              {/* preview */}
              <div>
                <label className="text-sm font-medium text-[#374151]">Pré-visualização</label>
                <div className="aspect-square bg-[#FFF4F0] rounded-2xl border border-[#FFD9CF] mt-2 overflow-hidden">
                  {selectedProducts.length > 0 ? (
                    <FeedMock
  style={style}
  products={selectedProducts.slice(0, 4).map((p) => ({
    id: String(p.id),
    title: p.title,
    price: Number(p.price ?? 0),
    image: (p as any).image,
  }))}
  caption={igVariants[igIndex]?.hook || ""}
/>
                  ) : (
                    <div className="grid place-items-center h-full text-center p-6">
                      <div>
                        <ImageIcon className="w-10 h-10 mx-auto mb-2 text-[#EE4D2D]" />
                        <p className="text-sm text-[#6B7280]">
                          Selecione produtos e clique em “Gerar mock” para visualizar aqui.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* REELS */}
      {tab === "reels" && (
        <section className="space-y-4">
          <div className="rounded-xl border border-[#FFD9CF] bg-white">
            <div className="p-4 border-b border-[#FFD9CF]">
              <h2 className="text-base font-semibold flex items-center gap-2 text-[#111827]">
                <PlayCircle className="w-5 h-5 text-[#EE4D2D]" /> Criador de Reels
              </h2>
            </div>
            <div className="p-4 grid lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-[#374151]">Gancho (Hook)</label>
                <input
                  className="border border-[#FFD9CF] rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D]"
                  placeholder="Ex.: 3 achados que você não sabia na Shopee"
                />
                <label className="text-sm font-medium text-[#374151]">Roteiro (bullet points)</label>
                <textarea
                  rows={8}
                  className="w-full border border-[#FFD9CF] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D]"
                  placeholder={`• Produto 1: benefício + preço
• Produto 2: benefício + preço
• CTA: link na bio / cupom`}
                />
                <div className="grid grid-cols-2 gap-2 items-center">
                  <div className="flex items-center gap-2 text-sm text-[#374151]">
                    <Clock className="w-4 h-4 text-[#EE4D2D]" />
                    <span>Duração alvo (s)</span>
                  </div>
                  <input
                    type="number"
                    defaultValue={24}
                    className="border border-[#FFD9CF] rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 rounded-lg bg-[#EE4D2D] hover:bg-[#D8431F] text-white"
                    onClick={() => alert("TODO: n8n — gerar storyboard + áudio TTS + legendas")}
                  >
                    Gerar com n8n
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg border border-[#FFD9CF] hover:bg-[#FFF4F0]"
                    onClick={() => alert("TODO: exportar roteiro .txt")}
                  >
                    Exportar roteiro
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#374151]">Storyboard (prévia)</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[9/16] bg-[#FFF4F0] rounded-xl border border-[#FFD9CF] grid place-items-center text-xs text-[#6B7280]"
                    >
                      Cena {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TIRINHAS */}
      {tab === "tirinhas" && (
        <section className="space-y-4">
          <div className="rounded-xl border border-[#FFD9CF] bg-white">
            <div className="p-4 border-b border-[#FFD9CF]">
              <h2 className="text-base font-semibold flex items-center gap-2 text-[#111827]">
                <Laugh className="w-5 h-5 text-[#EE4D2D]" /> Tirinhas — cotidiano de quem compra online
              </h2>
            </div>
            <div className="p-4 grid lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-[#374151]">Formato</label>
                <div className="grid grid-cols-3 gap-2">
                  {["3 painéis", "4 painéis", "1x3 horizontal"].map((f) => (
                    <button
                      key={f}
                      className="px-3 py-1.5 border border-[#FFD9CF] rounded-lg text-sm flex items-center gap-2 hover:bg-[#FFF4F0] text-[#111827]"
                    >
                      <Type className="w-4 h-4 text-[#EE4D2D]" />
                      {f}
                    </button>
                  ))}
                </div>
                <label className="text-sm font-medium text-[#374151]">Ideia/Setup</label>
                <textarea
                  rows={3}
                  className="w-full border border-[#FFD9CF] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D]"
                  placeholder="Ex.: Esperando o pacote que 'chega amanhã' há 5 dias…"
                />
                <label className="text-sm font-medium text-[#374151]">Diálogos</label>
                <textarea
                  rows={6}
                  className="w-full border border-[#FFD9CF] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D]"
                  placeholder={`Painel 1: ...
Painel 2: ...
Punchline: ...`}
                />
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 rounded-lg bg-[#EE4D2D] hover:bg-[#D8431F] text-white"
                    onClick={() => alert("TODO: n8n — gerar tirinha com personagens/estilo e balões")}
                  >
                    Gerar com n8n
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg border border-[#FFD9CF] hover:bg-[#FFF4F0]"
                    onClick={() => alert("TODO: exportar roteiro")}
                  >
                    Exportar roteiro
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#374151]">Prévia</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-[#FFF4F0] rounded-xl border border-[#FFD9CF] grid place-items-center text-xs text-[#6B7280]"
                    >
                      Painel {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Rodapé de ações */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-[#6B7280]">
          Amazon e Mercado Livre: seções idênticas a esta, compartilhando o mesmo Designer/Reels/Tirinhas.
        </div>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-lg border border-[#FFD9CF] hover:bg-[#FFF4F0]"
            onClick={() => alert("TODO: salvar rascunho no Supabase")}
          >
            Salvar rascunho
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-[#EE4D2D] hover:bg-[#D8431F] text-white"
            onClick={() => alert("TODO: publicar/agendar via n8n")}
          >
            Publicar/Agendar
          </button>
        </div>
      </div>
    </main>
  );
}