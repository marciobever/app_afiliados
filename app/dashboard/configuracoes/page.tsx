'use client';

import React, { useEffect, useState } from "react";
import { Settings, Store, Palette, CalendarClock, Network } from "lucide-react";

/** =========================================================
 *  UI BÁSICA PARA USUÁRIO FINAL
 *  - Plataformas (somente Shopee, campos simples)
 *  - Redes Sociais (Instagram/Facebook + MetaConnect)
 *  - Branding (cores/logo/fonte)
 *  - Publicação (frequência e janela)
 *  Nada de n8n, Supabase, chaves, etc.
 *  ======================================================= */

type TabKey = "plataformas" | "redes" | "branding" | "publicacao";

/* ----------------- Pequenos componentes de UI ----------------- */
function Tabs({
  value,
  onChange,
  tabs,
}: {
  value: TabKey;
  onChange: (v: TabKey) => void;
  tabs: { key: TabKey; label: string; icon?: React.ReactNode }[];
}) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-4 rounded-xl overflow-hidden border border-[#FFD9CF] bg-white">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={[
              "px-4 py-2 text-sm font-medium border-r last:border-r-0 transition-colors flex items-center justify-center gap-2",
              "border-[#FFD9CF]",
              value === t.key
                ? "bg-[#EE4D2D] text-white"
                : "bg-white text-[#111827] hover:bg-[#FFF4F0]",
            ].join(" ")}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#FFD9CF] bg-white">
      <div className="p-4 border-b border-[#FFD9CF]">
        <h3 className="font-semibold">{title}</h3>
        {subtitle ? <p className="text-sm text-[#6B7280] mt-1">{subtitle}</p> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[#374151]">{label}</label>
      {children}
      {hint ? <p className="text-xs text-[#6B7280]">{hint}</p> : null}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "border border-[#FFD9CF] rounded-lg px-3 py-2 w-full",
        "focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D]",
        props.className || "",
      ].join(" ")}
    />
  );
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "border border-[#FFD9CF] rounded-lg p-2 w-full",
        "focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D]",
        props.className || "",
      ].join(" ")}
    />
  );
}
function SaveBar({
  onSave,
  onReset,
}: {
  onSave: () => void;
  onReset?: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      {onReset ? (
        <button
          className="px-4 py-2 rounded-lg border border-[#FFD9CF] hover:bg-[#FFF4F0]"
          onClick={onReset}
        >
          Restaurar
        </button>
      ) : null}
      <button
        className="px-4 py-2 rounded-lg bg-[#EE4D2D] hover:bg-[#D8431F] text-white"
        onClick={onSave}
      >
        Salvar
      </button>
    </div>
  );
}

/** ---------- Status/Conexão com Meta (simples) ---------- */
function MetaConnect() {
  const [status, setStatus] = useState<null | { connected: boolean; meta_user_id?: string; error?: string }>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    try {
      const r = await fetch("/api/meta/status", { cache: "no-store" });
      const j = await r.json();
      setStatus(j);
    } catch {
      setStatus({ connected: false, error: "Falha ao consultar status" });
    }
  }

  useEffect(() => {
    refresh();
    function onMsg(ev: MessageEvent) {
      if (ev?.data?.meta_connected) refresh();
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  async function openLogin() {
    setLoading(true);
    try {
      window.open("/api/meta/login", "meta_login", "width=680,height=760");
      setTimeout(refresh, 5000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        className="px-3 py-2 rounded-lg bg-[#1877F2] hover:bg-[#145DBF] text-white text-sm"
        disabled={loading}
        onClick={openLogin}
      >
        {loading ? "Abrindo Meta…" : status?.connected ? "Reconectar Meta" : "Conectar Meta"}
      </button>
      {status?.connected ? (
        <span className="text-sm text-green-700">
          Conectado {status.meta_user_id ? `(#${status.meta_user_id})` : ""}
        </span>
      ) : (
        <span className="text-sm text-[#6B7280]">Não conectado</span>
      )}
      {status?.error ? <span className="text-sm text-red-600">{status.error}</span> : null}
    </div>
  );
}

/* ----------------- Página ----------------- */
export default function ConfiguracoesPage() {
  const [tab, setTab] = useState<TabKey>("plataformas");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#EE4D2D]" /> Configurações
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Ajuste suas preferências de busca e publicação. Você pode conectar suas redes sociais aqui.
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { key: "plataformas", label: "Plataformas", icon: <Store className="w-4 h-4" /> },
          { key: "redes", label: "Redes Sociais", icon: <Network className="w-4 h-4" /> },
          { key: "branding", label: "Branding", icon: <Palette className="w-4 h-4" /> },
          { key: "publicacao", label: "Publicação", icon: <CalendarClock className="w-4 h-4" /> },
        ]}
      />

      {/* ==== ABA: PLATAFORMAS (apenas o essencial) ==== */}
      {tab === "plataformas" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Shopee */}
          <Section title="Shopee" subtitle="Configurações básicas para busca de produtos.">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Termos padrão de busca" hint="Separados por vírgula.">
                <Input placeholder="ex.: smartwatch, fone bluetooth, ring light" />
              </Field>
              <Field label="País / Marketplace">
                <Input placeholder="ex.: BR" />
              </Field>
              <Field label="Página de afiliado / Link base">
                <Input placeholder="https://shopee.com.br/..." />
              </Field>
              <Field label="Observações">
                <Textarea rows={3} placeholder="Categorias a priorizar, preço mínimo, etc." />
              </Field>
            </div>
            <div className="mt-4">
              <SaveBar onSave={() => alert("Shopee: Salvo!")} onReset={() => alert("Shopee: Restaurado")} />
            </div>
          </Section>

          {/* Espaço reservado para outras plataformas futuras */}
          <Section title="Outras plataformas" subtitle="Em breve.">
            <p className="text-sm text-[#6B7280]">
              Suporte a Amazon e Mercado Livre será adicionado futuramente.
            </p>
          </Section>
        </div>
      )}

      {/* ==== ABA: REDES SOCIAIS ==== */}
      {tab === "redes" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Section title="Meta (Instagram / Facebook)" subtitle="Conecte sua conta para publicar.">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Status da Conexão">
                <MetaConnect />
              </Field>
              <Field label="Destino padrão (Feed/Reels/Stories)">
                <Input placeholder="Feed" />
              </Field>
              <Field label="Instagram Business ID (opcional)">
                <Input placeholder="1784..." />
              </Field>
              <Field label="Página do Facebook (opcional)">
                <Input placeholder="ID ou @pagina" />
              </Field>
            </div>
            <div className="mt-4">
              <SaveBar onSave={() => alert("Redes Sociais: Salvo!")} />
            </div>
          </Section>

          <Section title="Legendas padrão" subtitle="Prefixos e padrões para suas publicações.">
            <div className="grid gap-4">
              <Field label="Legenda padrão (prefixo)">
                <Textarea rows={4} placeholder="🔥 Oferta do dia..." />
              </Field>
            </div>
            <div className="mt-4">
              <SaveBar onSave={() => alert("Legendas: Salvo!")} />
            </div>
          </Section>
        </div>
      )}

      {/* ==== ABA: BRANDING ==== */}
      {tab === "branding" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Section title="Identidade Visual" subtitle="Cores, logo e tipografia.">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Cor primária">
                <Input type="color" defaultValue="#EE4D2D" />
              </Field>
              <Field label="Cor de acento">
                <Input type="color" defaultValue="#FF6A3C" />
              </Field>
              <Field label="Logo (URL)">
                <Input placeholder="https://..." />
              </Field>
              <Field label="Fonte preferida">
                <Input placeholder="Inter / System UI" />
              </Field>
              <Field label="Marca d'água (texto)">
                <Input placeholder="@minhaloja" />
              </Field>
            </div>
            <div className="mt-4">
              <SaveBar onSave={() => alert("Branding: Salvo!")} onReset={() => alert("Branding: Restaurado")} />
            </div>
          </Section>
        </div>
      )}

      {/* ==== ABA: PUBLICAÇÃO ==== */}
      {tab === "publicacao" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Section title="Agendamento" subtitle="Frequência e janela de postagem.">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Frequência diária">
                <Input placeholder="ex.: 3 posts/dia" />
              </Field>
              <Field label="Janela de postagem">
                <Input placeholder="ex.: 10:00–22:00" />
              </Field>
              <Field label="Distribuição por rede">
                <Input placeholder="IG:2 | FB:1" />
              </Field>
            </div>
            <div className="mt-4">
              <SaveBar onSave={() => alert("Agendamento: Salvo!")} />
            </div>
          </Section>

          <Section title="Templates de Post" subtitle="Presets simples.">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Template (Feed)">
                <Input placeholder="minimal, promo, dark..." />
              </Field>
              <Field label="Template (Reels)">
                <Input placeholder="gancho rápido, 24s" />
              </Field>
              <Field label="Template (Tirinhas)">
                <Input placeholder="3 painéis — cotidiano" />
              </Field>
            </div>
            <div className="mt-4">
              <SaveBar onSave={() => alert("Templates: Salvo!")} />
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
