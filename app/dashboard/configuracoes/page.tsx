'use client';

import React, { useEffect, useState } from "react";
import { Settings, Store, Network } from "lucide-react";

/* ========================================================
   CONFIGURAÇÕES SIMPLIFICADAS — versão limpa e funcional
   ======================================================== */

type TabKey = "plataformas" | "redes";

/* ---------- Componentes reutilizáveis ---------- */
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
      <div className="grid grid-cols-2 rounded-xl overflow-hidden border border-[#FFD9CF] bg-white">
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
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[#374151]">{label}</label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "border border-[#FFD9CF] rounded-lg px-3 py-2 w-full text-sm",
        "focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D]",
        props.className || "",
      ].join(" ")}
    />
  );
}

/* ---------- Meta / Instagram Connection ---------- */
function MetaConnect({ onSelect }: { onSelect: (id: string) => void }) {
  const [status, setStatus] = useState<{ connected: boolean; meta_user_id?: string; error?: string } | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function refreshStatus() {
    const r = await fetch("/api/meta/status", { cache: "no-store" });
    const j = await r.json();
    setStatus(j);
  }

  async function connectMeta() {
    setLoading(true);
    try {
      window.open("/api/meta/login", "meta_login", "width=680,height=760");
      setTimeout(refreshStatus, 5000);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAccounts() {
    const r = await fetch("/api/meta/instagram-accounts");
    const j = await r.json();
    if (j?.accounts?.length) setAccounts(j.accounts);
    else alert("Nenhuma conta de Instagram Business encontrada.");
  }

  async function handleSelect(accountId: string) {
    onSelect(accountId);
    alert(`Conta Instagram selecionada: ${accountId}`);
  }

  useEffect(() => {
    refreshStatus();
    const listener = (ev: MessageEvent) => {
      if (ev.data?.meta_connected) refreshStatus();
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="px-3 py-2 rounded-lg bg-[#1877F2] hover:bg-[#145DBF] text-white text-sm"
          disabled={loading}
          onClick={connectMeta}
        >
          {loading ? "Abrindo Meta…" : status?.connected ? "Reconectar Meta" : "Conectar Meta"}
        </button>

        {status?.connected && (
          <button
            onClick={fetchAccounts}
            className="px-3 py-2 rounded-lg border border-[#FFD9CF] text-sm hover:bg-[#FFF4F0]"
          >
            Buscar Contas Instagram
          </button>
        )}
      </div>

      {accounts.length > 0 && (
        <div className="border border-[#FFD9CF] rounded-lg p-3 bg-[#FFF9F7]">
          <p className="text-sm mb-2 font-medium">Selecione uma conta:</p>
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="flex justify-between items-center p-2 border-b last:border-none border-[#FFD9CF]"
            >
              <div>
                <div className="text-sm font-medium">{acc.name}</div>
                {acc.instagram_business_account && (
                  <div className="text-xs text-gray-500">
                    IG: @{acc.instagram_business_account.username}
                  </div>
                )}
              </div>
              {acc.instagram_business_account?.id && (
                <button
                  className="text-xs px-2 py-1 bg-[#EE4D2D] text-white rounded hover:bg-[#D8431F]"
                  onClick={() =>
                    handleSelect(acc.instagram_business_account.id)
                  }
                >
                  Usar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Página ---------- */
export default function ConfiguracoesPage() {
  const [tab, setTab] = useState<TabKey>("plataformas");
  const [instagramId, setInstagramId] = useState("");

  function salvarRedes() {
    alert(`Salvo com sucesso! Instagram ID: ${instagramId || "nenhum selecionado"}`);
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#EE4D2D]" /> Configurações
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Conecte suas plataformas e redes sociais para automatizar publicações.
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { key: "plataformas", label: "Plataformas", icon: <Store className="w-4 h-4" /> },
          { key: "redes", label: "Redes Sociais", icon: <Network className="w-4 h-4" /> },
        ]}
      />

      {/* === PLATAFORMAS === */}
      {tab === "plataformas" && (
        <Section
          title="Shopee"
          subtitle="Defina como buscar e promover produtos afiliados."
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Termos padrão de busca">
              <Input placeholder="ex.: smartwatch, fone bluetooth, ring light" />
            </Field>
            <Field label="País / Marketplace">
              <Input placeholder="ex.: BR" />
            </Field>
            <Field label="Página de afiliado / Link base">
              <Input placeholder="https://shopee.com.br/..." />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => alert("Shopee: configurações salvas!")}
              className="px-4 py-2 rounded-lg bg-[#EE4D2D] text-white hover:bg-[#D8431F]"
            >
              Salvar
            </button>
          </div>
        </Section>
      )}

      {/* === REDES === */}
      {tab === "redes" && (
        <Section
          title="Meta / Instagram"
          subtitle="Conecte sua conta e escolha o perfil do Instagram Business."
        >
          <MetaConnect onSelect={setInstagramId} />

          <div className="mt-4">
            <Field label="Instagram Business ID Selecionado">
              <Input
                value={instagramId}
                onChange={(e) => setInstagramId(e.target.value)}
                placeholder="1784..."
              />
            </Field>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={salvarRedes}
              className="px-4 py-2 rounded-lg bg-[#EE4D2D] text-white hover:bg-[#D8431F]"
            >
              Salvar
            </button>
          </div>
        </Section>
      )}
    </div>
  );
}
