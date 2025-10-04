'use client';

import React, { useEffect, useState } from "react";
import { Settings, Store, Cog, ShieldCheck, Palette, CalendarClock, Network } from "lucide-react";

/**
 * Configurações — organizado por abas:
 * - Plataformas (Shopee, Amazon, Mercado Livre)
 * - Redes Sociais (Instagram, Facebook)
 * - Branding (cores, logo, fontes)
 * - Publicação (agendamento, formatos)
 * - Integrações (Supabase, n8n)
 * - Segurança (chaves, permissões)
 *
 * Puro Tailwind, UI consistente com o tema Shopee
 */

type TabKey =
  | "plataformas"
  | "redes"
  | "branding"
  | "publicacao"
  | "integracoes"
  | "seguranca";

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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 rounded-xl overflow-hidden border border-[#FFD9CF] bg-white">
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

/** ---------- Botão/Status de conexão com Meta ---------- */
function MetaConnect() {
  const [status, setStatus] = useState<null | { connected: boolean; meta_user_id?: string; error?: string }>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    try {
      const r = await fetch("/api/meta/status", { cache: "no-store" });
      const j = await r.json();
      setStatus(j);
    } catch (e) {
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
      // fallback caso não receba postMessage
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
          Centralize todas as credenciais e preferências de publicação. As alterações afetam o fluxo de geração e postagem.
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
          { key: "integracoes", label: "Integrações", icon: <Cog className="w-4 h-4" /> },
          { key: "seguranca", label: "Segurança", icon: <ShieldCheck className="w-4 h-4" /> },
        ]}
      />

      {/* ==== ABA: PLATAFORMAS ==== */}
      {tab === "plataformas" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Shopee */}
          <Section
            title="Shopee"
            subtitle="Parâmetros para busca de produtos e webhooks do n8n."
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Termos padrão de busca" hint="Separados por vírgula.">
                <Input placeholder="ex.: smartwatch, fone bluetooth, ring light" />
              </Field>
              <Field label="País / Marketplace">
                <Input placeholder="ex.: BR" />
              </Field>
              <Field label="n8n — Webhook Buscar Produtos" hint="URL do workflow que retorna lista de produtos.">
                <Input placeholder="https://n8n.seudominio.com/webhook/shopee-search" />
              </Field>
              <Field label="n8n — Webhook Arte Feed" hint="Gera imagem de post no padrão Shopee.">
                <Input placeholder="https://n8n.seudominio.com/webhook/shopee-feed-art" />
              </Field>
              <Field label="Página de afiliado / Link base">
                <Input placeholder="https://shopee.com.br/..." />
              </Field>
              <Field label="Observações">
                <Textarea rows={3} placeholder="Regras de comissão, categorias a priorizar etc." />
              </Field>
            </div>
            <div className="mt-4">
              <SaveBar onSave={() => alert("Shopee: Salvo!")} onReset={() => alert("Shopee: Restaurado")} />
            </div>
          </Section>

          {/* Amazon */}
          <Section
            title="Amazon (em construção)"
            subtitle="Já deixe as credenciais preparadas."
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Partner Tag">
                <Input placeholder="seu-tag-20" />
              </Field>
              <Field label="Access Key / Secret Key">
                <Input placeholder="AKIA..." />
              </Field>
              <Field label="n8n — Webhook Buscar Produtos">
                <Input placeholder="https://n8n.seudominio.com/webhook/amazon-search" />
              </Field>
              <Field label="Região">
                <Input placeholder="ex.: BR, US" />
              </Field>
            </div>
            <div className="mt-4">
              <SaveBar onSave={() => alert("Amazon: Salvo!")} />
            </div>
          </Section>

          {/* Mercado Livre */}
          <Section
            title="Mercado Livre (em construção)"
            subtitle="Configuração para as buscas e formatação."
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="App ID / Secret">
                <Input placeholder="APP-ID / SECRET" />
              </Field>
              <Field label="n8n — Webhook Buscar Produtos">
                <Input placeholder="https://n8n.seudominio.com/webhook/ml-search" />
              </Field>
              <Field label="Filtro de categorias">
                <Input placeholder="ex.: MLB1055, MLB1648" />
              </Field>
              <Field label="Observações">
                <Textarea rows={3} placeholder="Ex.: ignorar produtos sem variações, preço mínimo, etc." />
              </Field>
            </div>
            <div className="mt-4">
              <SaveBar onSave={() => alert("Mercado Livre: Salvo!")} />
            </div>
          </Section>
        </div>
      )}

      {/* ==== ABA: REDES SOCIAIS ==== */}
      {tab === "redes" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Instagram */}
          <Section title="Instagram" subtitle="Conta, tokens e destinos.">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Status da Conexão (Meta)">
                <MetaConnect />
              </Field>

              <Field label="Instagram Business ID">
                <Input placeholder="1784..." />
              </Field>
              <Field label="Access Token (Long-Lived)">
                <Input placeholder="IGQ..." />
              </Field>
              <Field label="Destino padrão (Feed/Reels/Stories)">
                <Input placeholder="Feed" />
              </Field>
              <Field label="n8n — Webhook Postar">
                <Input placeholder="https://n8n.seudominio.com/webhook/ig-post" />
              </Field>
            </div>
            <div className="mt-4">
              <SaveBar onSave={() => alert("Instagram: Salvo!")} />
            </div>
          </Section>

          {/* Facebook */}
          <Section title="Facebook" subtitle="Páginas, tokens e formatação.">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Page ID">
                <Input placeholder="1234567890" />
              </Field>
              <Field label="Page Access Token">
                <Input placeholder="EAAB..." />
              </Field>
              <Field label="Formato padrão (imagem/álbum)">
                <Input placeholder="imagem" />
              </Field>
              <Field label="n8n — Webhook Postar">
                <Input placeholder="https://n8n.seudominio.com/webhook/fb-post" />
              </Field>
            </div>
            <div className="mt-4">
              <SaveBar onSave={() => alert("Facebook: Salvo!")} />
            </div>
          </Section>
        </div>
      )}

      {/* ==== ABA: BRANDING ==== */}
      {tab === "branding" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Section title="Identidade Visual" subtitle="Cores, logos e tipografia.">
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
              <Field label="Observações">
                <Textarea rows={3} placeholder="Como aplicar logo em posts, margem mínima, etc." />
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
          <Section title="Agendamento" subtitle="Regras de horário e frequência.">
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
              <Field label="n8n — Webhook Agendar">
                <Input placeholder="https://n8n.seudominio.com/webhook/schedule" />
              </Field>
            </div>
            <div className="mt-4">
              <SaveBar onSave={() => alert("Publicação/Agendamento: Salvo!")} />
            </div>
          </Section>

          <Section title="Templates" subtitle="Presets para Feed, Reels e Tirinhas.">
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
              <Field label="Legenda padrão (prefixo)">
                <Textarea rows={3} placeholder="🔥 Oferta do dia..." />
              </Field>
            </div>
            <div className="mt-4">
              <SaveBar onSave={() => alert("Templates: Salvo!")} />
            </div>
          </Section>
        </div>
      )}

      {/* ==== ABA: INTEGRAÇÕES ==== */}
      {tab === "integracoes" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Section title="Supabase" subtitle="Banco e storage.">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="URL do projeto">
                <Input placeholder="https://xyzcompany.supabase.co" />
              </Field>
              <Field label="Anon Key">
                <Input placeholder="eyJhbGciOi..." />
              </Field>
              <Field label="Tabela de Produtos">
                <Input placeholder="products" />
              </Field>
              <Field label="Bucket de Imagens">
                <Input placeholder="assets" />
              </Field>
            </div>
            <div className="mt-4">
              <SaveBar onSave={() => alert("Supabase: Salvo!")} />
            </div>
          </Section>

          <Section title="n8n" subtitle="Base URL e webhooks padrão.">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Base URL">
                <Input placeholder="https://n8n.seudominio.com" />
              </Field>
              <Field label="Auth (opcional)">
                <Input placeholder="Bearer xxxxx" />
              </Field>
              <Field label="Timeout (ms)">
                <Input placeholder="20000" />
              </Field>
              <Field label="Observações">
                <Textarea rows={3} placeholder="Nome dos workflows, versionamento, etc." />
              </Field>
            </div>
            <div className="mt-4">
              <SaveBar onSave={() => alert("n8n: Salvo!")} />
            </div>
          </Section>
        </div>
      )}

      {/* ==== ABA: SEGURANÇA ==== */}
      {tab === "seguranca" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Section title="Permissões" subtitle="Controles básicos de acesso.">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Administrador (e-mail)">
                <Input placeholder="admin@dominio.com" />
              </Field>
              <Field label="Editores (e-mails)">
                <Textarea rows={3} placeholder="user1@...; user2@..." />
              </Field>
              <Field label="Somente publicação com aprovação">
                <Input placeholder="true / false" />
              </Field>
              <Field label="Logs (retentativa / auditoria)">
                <Input placeholder="7 dias" />
              </Field>
            </div>
            <div className="mt-4">
              <SaveBar onSave={() => alert("Segurança: Salvo!")} />
            </div>
          </Section>

          <Section title="Chaves Sensíveis" subtitle="(use .env em produção)">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Criptografia local (salt)">
                <Input placeholder="••••••••" />
              </Field>
              <Field label="Webhook Secret">
                <Input placeholder="••••••••" />
              </Field>
            </div>
            <div className="mt-4">
              <SaveBar onSave={() => alert("Chaves: Salvo!")} />
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}