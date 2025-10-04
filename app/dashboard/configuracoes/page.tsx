'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Settings, Store, Network, CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react';

type TabKey = 'plataformas' | 'redes';

/* ----------------------------- Helpers --------------------------------- */
function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(' ');
}
function toast(msg: string) {
  alert(msg);
}
function normSubIdsFromText(text: string) {
  return text
    .split(/\n|,|;/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
}
function subIdsToText(list: string[]) {
  return (list || []).slice(0, 5).join('\n');
}

/* ---------------------------- UI atoms --------------------------------- */
function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      {...props}
      className={cx(
        'rounded-2xl border border-[#FFD9CF] bg-white shadow-sm',
        props.className
      )}
    />
  );
}
function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between p-5 border-b border-[#FFD9CF]">
      <div>
        <h3 className="font-semibold text-base">{title}</h3>
        {subtitle ? <p className="text-sm text-[#6B7280] mt-0.5">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}
function CardBody(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx('p-5', props.className)} />;
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
      className={cx(
        'border border-[#FFD9CF] rounded-lg px-3 py-2 w-full text-sm',
        'focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D]',
        props.className
      )}
    />
  );
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cx(
        'border border-[#FFD9CF] rounded-lg p-2 w-full text-sm',
        'focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D]',
        props.className
      )}
    />
  );
}
function Button({
  children,
  variant = 'primary',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'outline';
}) {
  const styles =
    variant === 'primary'
      ? 'bg-[#EE4D2D] hover:bg-[#D8431F] text-white'
      : variant === 'outline'
      ? 'border border-[#FFD9CF] hover:bg-[#FFF4F0] text-[#111827]'
      : 'text-[#111827] hover:bg-[#FFF4F0]';
  return (
    <button
      {...rest}
      className={cx(
        'px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        styles,
        rest.className
      )}
    >
      {children}
    </button>
  );
}
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
      <div className="grid grid-cols-2 rounded-2xl overflow-hidden border border-[#FFD9CF] bg-white shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cx(
              'px-4 py-3 text-sm font-medium border-r last:border-r-0 transition-colors flex items-center justify-center gap-2',
              'border-[#FFD9CF]',
              value === t.key
                ? 'bg-[#EE4D2D] text-white'
                : 'bg-white text-[#111827] hover:bg-[#FFF4F0]'
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ----------------------- Shopee Credentials ---------------------------- */
function ShopeeCredentialsCard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [appId, setAppId] = useState('');
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [region, setRegion] = useState('BR');
  const [active, setActive] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetch('/api/integrations/shopee/credentials', {
          cache: 'no-store',
        });
        const j = await r.json();
        if (j?.credentials) {
          setAppId(j.credentials.app_id ?? '');
          setRegion(j.credentials.region ?? 'BR');
          setActive(Boolean(j.credentials.active));
        }
      } catch {
        /* noop */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    setSaving(true);
    try {
      const r = await fetch('/api/integrations/shopee/credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, secret, region, active }),
      });
      const j = await r.json();
      if (!r.ok || j?.error) {
        toast(j?.error || 'Falha ao salvar credenciais.');
      } else {
        toast('Credenciais da Shopee salvas!');
        setSecret('');
      }
    } catch (e: any) {
      toast(e?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Shopee — Credenciais"
        subtitle="Informe as chaves do seu app da Shopee. Os dados são salvos por organização."
        right={
          loading ? (
            <div className="flex items-center gap-2 text-sm text-[#6B7280]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando…
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-green-700">
              <CheckCircle2 className="w-4 h-4" />
              Pronto
            </div>
          )
        }
      />
      <CardBody>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="App ID">
            <Input
              placeholder="ex.: 1835..."
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
            />
          </Field>
          <Field label="Secret">
            <div className="relative">
              <Input
                placeholder="••••••••••••••"
                type={showSecret ? 'text' : 'password'}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#6B7280]"
                onClick={() => setShowSecret((v) => !v)}
                aria-label={showSecret ? 'Ocultar' : 'Mostrar'}
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          <Field label="Região">
            <Input placeholder="BR" value={region} onChange={(e) => setRegion(e.target.value)} />
          </Field>
          <Field label="Ativo">
            <div className="flex items-center gap-3">
              <input
                id="active"
                type="checkbox"
                className="h-4 w-4 accent-[#EE4D2D]"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <label htmlFor="active" className="text-sm text-[#374151]">
                Usar estas credenciais
              </label>
            </div>
          </Field>
        </div>

        <div className="mt-5 flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Salvando…
              </span>
            ) : (
              'Salvar'
            )}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

/* -------------------------- Shopee SubIDs ------------------------------- */
function ShopeeSubIdsCard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [text, setText] = useState('');

  // normaliza qualquer formato vindo da API (array OU objeto)
  function normalizeIncomingSubids(raw: any): string[] {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') {
      const {
        main_channel = '',
        sub_channel = '',
        extra_1 = '',
        extra_2 = '',
      } = raw;
      // placeholders comuns ocupam slots 3/4
      return [main_channel, sub_channel, '{{item_id}}', '{{exec}}', extra_1 || extra_2 || ''];
    }
    return [];
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetch('/api/integrations/shopee/subids', { cache: 'no-store' });
        const j = await r.json();
        const list = normalizeIncomingSubids(j?.subids);
        setText(subIdsToText(list));
      } catch {
        /* noop */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const count = useMemo(() => normSubIdsFromText(text).length, [text]);

  async function save() {
    setSaving(true);
    try {
      const list = normSubIdsFromText(text);
      // mapeia para objeto também (backend pode aceitar ambos)
      const obj = {
        main_channel: list[0] || '',
        sub_channel: list[1] || '',
        extra_1: list[4] || '',
        extra_2: '',
      };
      const r = await fetch('/api/integrations/shopee/subids', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subids: list, ...obj }),
      });
      const j = await r.json();
      if (!r.ok || j?.error) toast(j?.error || 'Falha ao salvar SubIDs');
      else toast('SubIDs salvos!');
    } catch (e: any) {
      toast(e?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Shopee — SubIDs"
        subtitle="Até 5 SubIDs (um por linha). Suporta placeholders: {{item_id}} e {{exec}}."
        right={
          loading ? (
            <div className="flex items-center gap-2 text-sm text-[#6B7280]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando…
            </div>
          ) : (
            <span className="text-xs text-[#6B7280]">{count}/5</span>
          )
        }
      />
      <CardBody>
        <Textarea
          rows={6}
          placeholder={`_canal_principal
_sub_canal
{{item_id}}
{{exec}}
postauto`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <p className="text-xs text-[#6B7280] mt-2">
          Ex.: <code>main_channel</code>, <code>sub_channel</code>, <code>{'{'}item_id{'}'}</code>, <code>{'{'}exec{'}'}</code>, <code>postauto</code>.
        </p>
        <div className="mt-5 flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Salvando…
              </span>
            ) : (
              'Salvar'
            )}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

/* -------------------------- Meta / Instagram ---------------------------- */
function MetaConnect({
  onSelect,
  onSaved,
}: {
  onSelect: (id: string) => void;
  onSaved: (id: string) => void;
}) {
  const [status, setStatus] = useState<{ connected: boolean; meta_user_id?: string; error?: string } | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [igSelected, setIgSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function refreshStatus() {
    try {
      const r = await fetch('/api/meta/status', { cache: 'no-store' });
      const j = await r.json();
      setStatus(j);
    } catch {
      setStatus({ connected: false, error: 'Falha ao consultar status' });
    }
  }
  async function connectMeta() {
    setLoading(true);
    try {
      window.open('/api/meta/login', 'meta_login', 'width=680,height=760');
      setTimeout(refreshStatus, 5000);
    } finally {
      setLoading(false);
    }
  }
  async function fetchAccounts() {
    const r = await fetch('/api/meta/instagram-accounts', { cache: 'no-store' });
    const j = await r.json();
    if (Array.isArray(j?.accounts)) setAccounts(j.accounts);
    else toast('Nenhuma conta encontrada.');
  }
  async function saveInstagram() {
    if (!igSelected) {
      toast('Selecione um Instagram Business ID.');
      return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/meta/instagram/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instagram_business_id: igSelected }),
      });
      const j = await r.json();
      if (!r.ok || j?.error) toast(j?.error || 'Falha ao salvar Instagram');
      else {
        toast('Instagram salvo!');
        onSaved(igSelected);
      }
    } catch (e: any) {
      toast(e?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    refreshStatus();
    const listener = (ev: MessageEvent) => {
      if (ev.data?.meta_connected) refreshStatus();
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  return (
    <Card>
      <CardHeader
        title="Meta / Instagram"
        subtitle="Conecte sua conta Meta, liste as Páginas e selecione o Instagram Business."
        right={
          status?.connected ? (
            <div className="inline-flex items-center gap-2 text-xs text-green-700">
              <CheckCircle2 className="w-4 h-4" /> Conectado
            </div>
          ) : null
        }
      />
      <CardBody>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={connectMeta} disabled={loading}>
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Abrindo Meta…
              </span>
            ) : status?.connected ? (
              'Reconectar Meta'
            ) : (
              'Conectar Meta'
            )}
          </Button>

          {status?.connected && (
            <Button variant="outline" onClick={fetchAccounts}>
              Buscar Contas (Facebook → Instagram)
            </Button>
          )}
        </div>

        {accounts.length > 0 && (
          <div className="mt-4 rounded-xl border border-[#FFD9CF] bg-[#FFF9F7]">
            <div className="p-3 border-b border-[#FFD9CF] text-sm font-medium">
              Selecione uma conta Instagram
            </div>
            <div className="divide-y divide-[#FFD9CF]">
              {accounts.map((acc) => {
                const ig = acc.instagram_business_account;
                const usable = ig?.id;
                return (
                  <div key={acc.id} className="p-3 flex items-center justify-between">
                    <div className="text-sm">
                      <div className="font-medium">{acc.name}</div>
                      {ig?.username ? (
                        <div className="text-[#6B7280] text-xs">IG: @{ig.username}</div>
                      ) : (
                        <div className="text-[#6B7280] text-xs">Sem IG vinculado</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="igPick"
                        disabled={!usable}
                        checked={igSelected === ig?.id}
                        onChange={() => {
                          if (usable) {
                            setIgSelected(ig.id);
                            onSelect(ig.id);
                          }
                        }}
                      />
                      <span className="text-xs">{usable ? 'Selecionar' : 'Indisponível'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-3 flex justify-end">
              <Button onClick={saveInstagram} disabled={!igSelected || saving}>
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Salvando…
                  </span>
                ) : (
                  'Salvar Instagram'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

/* ------------------------------ Page ----------------------------------- */
export default function ConfiguracoesPage() {
  const [tab, setTab] = useState<TabKey>('plataformas');
  const [instagramId, setInstagramId] = useState('');

  return (
    <div className="max-w-6xl mx-auto px-4 pb-10 space-y-6">
      <div className="pt-4 sm:pt-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <Settings className="w-7 h-7 text-[#EE4D2D]" />
          Configurações
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Conecte suas plataformas e redes sociais. O que você salvar aqui será usado na busca de produtos e nas publicações.
        </p>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'plataformas', label: 'Plataformas', icon: <Store className="w-4 h-4" /> },
          { key: 'redes', label: 'Redes Sociais', icon: <Network className="w-4 h-4" /> },
        ]}
      />

      {tab === 'plataformas' ? (
        <div className="grid gap-6">
          <ShopeeCredentialsCard />
          <ShopeeSubIdsCard />
        </div>
      ) : (
        <div className="grid gap-6">
          <MetaConnect
            onSelect={(id) => setInstagramId(id)}
            onSaved={(id) => setInstagramId(id)}
          />
          {instagramId ? (
            <Card>
              <CardBody>
                <div className="text-sm">
                  <span className="font-medium">Instagram Business ID selecionado:</span>{' '}
                  <span className="text-[#111827]">{instagramId}</span>
                </div>
              </CardBody>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
