'use client';

import { useState, useEffect } from 'react';
import { Settings, Store, Network } from 'lucide-react';

/**
 * ========================================================
 * CONFIGURAÇÕES — versão simplificada e funcional
 * - Shopee: dados básicos para integração
 * - Meta / Instagram: conectar conta e escolher perfil
 * ========================================================
 */

type TabKey = 'plataformas' | 'redes';

// ---------- Componentes visuais básicos ----------
function Tabs({
  value,
  onChange,
  tabs,
}: {
  value: TabKey;
  onChange: (v: TabKey) => void;
  tabs: { key: TabKey; label: string; icon: React.ReactNode }[];
}) {
  return (
    <div className="grid grid-cols-2 rounded-xl overflow-hidden border border-[#FFD9CF] bg-white">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={[
            'px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 border-r last:border-r-0 border-[#FFD9CF]',
            value === t.key
              ? 'bg-[#EE4D2D] text-white'
              : 'bg-white text-[#111827] hover:bg-[#FFF4F0]',
          ].join(' ')}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
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
        {subtitle ? (
          <p className="text-sm text-[#6B7280] mt-1">{subtitle}</p>
        ) : null}
      </div>
      <div className="p-4 space-y-4">{children}</div>
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
        'border border-[#FFD9CF] rounded-lg px-3 py-2 w-full',
        'focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D]',
        props.className || '',
      ].join(' ')}
    />
  );
}

function SaveBar({ onSave }: { onSave: () => void }) {
  return (
    <div className="flex justify-end">
      <button
        className="px-4 py-2 rounded-lg bg-[#EE4D2D] hover:bg-[#D8431F] text-white"
        onClick={onSave}
      >
        Salvar
      </button>
    </div>
  );
}

// ---------- META CONNECT ----------
function MetaConnect() {
  const [status, setStatus] = useState<null | { connected: boolean; meta_user_id?: string; error?: string }>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    try {
      const r = await fetch('/api/meta/status', { cache: 'no-store' });
      const j = await r.json();
      setStatus(j);
    } catch {
      setStatus({ connected: false, error: 'Falha ao consultar status' });
    }
  }

  useEffect(() => {
    refresh();
    function onMsg(ev: MessageEvent) {
      if (ev?.data?.meta_connected) refresh();
    }
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  async function openLogin() {
    setLoading(true);
    try {
      window.open('/api/meta/login', 'meta_login', 'width=680,height=760');
      setTimeout(refresh, 4000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        className="px-3 py-2 rounded-lg bg-[#1877F2] hover:bg-[#145DBF] text-white text-sm"
        disabled={loading}
        onClick={openLogin}
      >
        {loading
          ? 'Abrindo Meta...'
          : status?.connected
          ? 'Reconectar Meta'
          : 'Conectar Meta'}
      </button>
      {status?.connected ? (
        <span className="text-sm text-green-700">
          ✅ Conectado {status.meta_user_id ? `(#${status.meta_user_id})` : ''}
        </span>
      ) : (
        <span className="text-sm text-gray-500">Não conectado</span>
      )}
      {status?.error ? (
        <span className="text-sm text-red-600">{status.error}</span>
      ) : null}
    </div>
  );
}

// ---------- Instagram Picker ----------
function InstagramIdPicker() {
  const [igAccounts, setIgAccounts] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);

  async function fetchInstagramAccounts() {
    try {
      setLoading(true);
      const res = await fetch('/api/meta/instagram-accounts');
      const data = await res.json();
      if (data?.accounts) setIgAccounts(data.accounts);
      else alert('Nenhuma conta encontrada.');
    } catch {
      alert('Erro ao buscar contas do Instagram.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={fetchInstagramAccounts}
        disabled={loading}
        className="px-3 py-2 rounded-lg bg-[#E1306C] hover:bg-[#C72A5F] text-white text-sm"
      >
        {loading ? 'Buscando...' : 'Buscar contas do Instagram'}
      </button>

      {igAccounts.length > 0 && (
        <select
          className="border border-[#FFD9CF] rounded-lg px-3 py-2 w-full"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">Selecione uma conta</option>
          {igAccounts.map((a) => (
            <option key={a.id} value={a.instagram_business_account?.id}>
              {a.instagram_business_account?.username || a.name} —{' '}
              {a.instagram_business_account?.id}
            </option>
          ))}
        </select>
      )}

      {selectedId && (
        <input
          type="text"
          readOnly
          value={selectedId}
          className="border border-[#FFD9CF] rounded-lg px-3 py-2 w-full bg-[#FFF4F0]"
        />
      )}
    </div>
  );
}

// ---------- PÁGINA PRINCIPAL ----------
export default function ConfiguracoesPage() {
  const [tab, setTab] = useState<TabKey>('plataformas');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#EE4D2D]" /> Configurações
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Ajuste suas credenciais de integração e redes sociais.
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'plataformas', label: 'Plataformas', icon: <Store className="w-4 h-4" /> },
          { key: 'redes', label: 'Redes Sociais', icon: <Network className="w-4 h-4" /> },
        ]}
      />

      {/* ==== PLATAFORMAS ==== */}
      {tab === 'plataformas' && (
        <Section
          title="Shopee"
          subtitle="Configurações básicas para integração e busca de produtos."
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Token da API Shopee">
              <Input placeholder="Cole aqui o token de afiliado da Shopee" />
            </Field>
            <Field label="Link de afiliado (base)">
              <Input placeholder="https://shopee.com.br/..." />
            </Field>
          </div>
          <SaveBar onSave={() => alert('Configurações salvas!')} />
        </Section>
      )}

      {/* ==== REDES SOCIAIS ==== */}
      {tab === 'redes' && (
        <Section
          title="Meta (Facebook / Instagram)"
          subtitle="Conecte sua conta Meta e vincule um perfil do Instagram Business."
        >
          <Field label="Conexão Meta">
            <MetaConnect />
          </Field>

          <Field label="Instagram Business ID">
            <InstagramIdPicker />
          </Field>

          <SaveBar onSave={() => alert('Redes sociais salvas!')} />
        </Section>
      )}
    </div>
  );
}
