'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings,
  Store,
  Network,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
  BookOpenCheck,
  PlayCircle,
  ListChecks,
} from 'lucide-react';

type TabKey = 'plataformas' | 'redes';

/* ----------------------------- Helpers --------------------------------- */
function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(' ');
}
function toast(msg: string) {
  alert(msg);
}

/* ---------------------------- UI atoms --------------------------------- */
function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      {...props}
      className={cx('rounded-2xl border border-[#FFD9CF] bg-white shadow-sm', props.className)}
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
              value === t.key ? 'bg-[#EE4D2D] text-white' : 'bg-white text-[#111827] hover:bg-[#FFF4F0]'
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
        const r = await fetch('/api/integrations/shopee/credentials', { cache: 'no-store' });
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
            <Input placeholder="ex.: 1835..." value={appId} onChange={(e) => setAppId(e.target.value)} />
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
  const SUBIDS_API = '/api/integrations/shopee/subids';

  type KnownPlatform =
    | 'instagram'
    | 'facebook'
    | 'x'
    | 'pinterest'
    | 'tiktok'
    | 'youtube'
    | 'whatsapp'
    | 'others';

  const KNOWN: KnownPlatform[] = [
    'instagram',
    'facebook',
    'x',
    'pinterest',
    'tiktok',
    'youtube',
    'whatsapp',
    'others',
  ];
  const LABEL: Record<KnownPlatform, string> = {
    instagram: 'Instagram',
    facebook: 'Facebook',
    x: 'X (Twitter)',
    pinterest: 'Pinterest',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    whatsapp: 'WhatsApp',
    others: 'Outros',
  };
  const ALIASES: Record<string, KnownPlatform> = {
    insta: 'instagram',
    ig: 'instagram',
    fb: 'facebook',
    meta: 'facebook',
    twitter: 'x',
    tw: 'x',
    pin: 'pinterest',
    yt: 'youtube',
    wa: 'whatsapp',
  };
  const normalizePlatform = (s: string): KnownPlatform | undefined => {
    const k = s.trim().toLowerCase();
    if (!k) return;
    if (KNOWN.includes(k as KnownPlatform)) return k as KnownPlatform;
    if (ALIASES[k]) return ALIASES[k];
    return;
  };

  type SubidsPayload = {
    by_platform: Partial<Record<KnownPlatform, string>>;
    default?: string;
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [byPlatform, setByPlatform] = useState<Partial<Record<KnownPlatform, string>>>({});
  const [defSubid, setDefSubid] = useState<string>('');
  const [platformInput, setPlatformInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  async function getJsonOrText(r: Response) {
    const txt = await r.text();
    try {
      return JSON.parse(txt);
    } catch {
      return { error: txt || `${r.status} ${r.statusText}` };
    }
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(SUBIDS_API, { cache: 'no-store' });
        const data = await getJsonOrText(r);
        if (!r.ok || data?.error) throw new Error(data?.error || `GET ${SUBIDS_API} -> ${r.status}`);
        const payload = (data?.subids || {}) as SubidsPayload;

        const current: Partial<Record<KnownPlatform, string>> = {};
        if (payload.by_platform && typeof payload.by_platform === 'object') {
          Object.entries(payload.by_platform).forEach(([k, v]) => {
            const norm = normalizePlatform(k);
            if (norm) current[norm] = String(v || '');
          });
        }
        setByPlatform(current);
        setDefSubid(payload.default || '');
        setError(null);
      } catch (e: any) {
        setError(e?.message || 'Falha ao carregar SubIDs');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function addPlatformFromInput() {
    const k = platformInput.trim();
    const norm = normalizePlatform(k);
    if (!norm) {
      setError('Plataforma inválida. Exemplos: Instagram, Facebook, X, Pinterest…');
      return;
    }
    setError(null);
    setByPlatform((prev) => ({ ...prev, [norm]: prev[norm] ?? '' }));
    setPlatformInput('');
  }

  function removePlatform(k: KnownPlatform) {
    setByPlatform((prev) => {
      const next = { ...prev };
      delete next[k];
      return next;
    });
  }

  function updateSubid(k: KnownPlatform, val: string) {
    setByPlatform((prev) => ({ ...prev, [k]: val }));
  }

  async function save() {
    try {
      setSaving(true);
      const payload: SubidsPayload = { by_platform: byPlatform, default: defSubid || '' };
      const r = await fetch(SUBIDS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await getJsonOrText(r);
      if (!r.ok || data?.error) throw new Error(data?.error || `PUT ${SUBIDS_API} -> ${r.status}`);
      setError(null);
      toast('SubIDs salvos!');
    } catch (e: any) {
      setError(e?.message || 'Erro ao salvar SubIDs');
      toast(e?.message || 'Erro ao salvar SubIDs');
    } finally {
      setSaving(false);
    }
  }

  const platformsCount = Object.keys(byPlatform).length;

  return (
    <Card>
      <CardHeader
        title="Shopee — SubIDs por plataforma"
        subtitle="Adicione a plataforma e informe o SubID (opcional). O sistema usa automaticamente o SubID correspondente ao publicar."
        right={
          loading ? (
            <div className="flex items-center gap-2 text-sm text-[#6B7280]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando…
            </div>
          ) : (
            <span className="text-xs text-[#6B7280]">{platformsCount} plataformas</span>
          )
        }
      />
      <CardBody>
        <div className="flex gap-2 mb-3">
          <Input
            placeholder="Digite a plataforma e pressione Enter (ex.: Instagram, Facebook, X)"
            value={platformInput}
            onChange={(e) => setPlatformInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addPlatformFromInput();
              }
            }}
          />
          <Button onClick={addPlatformFromInput}>Adicionar</Button>
        </div>

        {platformsCount === 0 ? (
          <p className="text-sm text-[#6B7280] mb-3">Nenhuma plataforma adicionada ainda.</p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          {Object.entries(byPlatform).map(([k, val]) => {
            const key = k as KnownPlatform;
            return (
              <div key={key} className="border rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{LABEL[key] ?? key}</span>
                  <button
                    className="text-xs text-red-600 hover:underline"
                    onClick={() => removePlatform(key)}
                    type="button"
                  >
                    remover
                  </button>
                </div>
                <Input placeholder="SubID (opcional)" value={val || ''} onChange={(e) => updateSubid(key, e.target.value)} />
                {showAdvanced && (
                  <p className="mt-1 text-[12px] text-[#6B7280]">
                    Dica: variáveis como <code>{'{'}item_id{'}'}</code> e <code>{'{'}exec{'}'}</code> são opcionais.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <Field label="SubID padrão (fallback)" hint="Usado quando a plataforma não tiver um SubID específico.">
            <Input placeholder="Ex.: postauto" value={defSubid} onChange={(e) => setDefSubid(e.target.value)} />
          </Field>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showAdvanced} onChange={(e) => setShowAdvanced(e.target.checked)} />
            Mostrar opções avançadas (variáveis)
          </label>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.reload()} disabled={saving}>
              Cancelar
            </Button>
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
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
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
            <div className="p-3 border-b border-[#FFD9CF] text-sm font-medium">Selecione uma conta Instagram</div>
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

/* ------------------------------ Tutorial Modal ------------------------- */
function TutorialModal({
  open,
  onClose,
  goPlataformas,
  goRedes,
}: {
  open: boolean;
  onClose: () => void;
  goPlataformas: () => void;
  goRedes: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-[61] w-full sm:max-w-2xl mx-auto rounded-2xl bg-white border border-[#FFD9CF] shadow-xl">
        <div className="p-5 border-b border-[#FFD9CF] flex items-center gap-2">
          <BookOpenCheck className="w-5 h-5 text-[#EE4D2D]" />
          <h3 className="text-base font-semibold">Tutorial — começo rápido</h3>
        </div>
        <div className="p-5 space-y-4">
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FFF4F0] text-[#7A2E1B] text-xs font-semibold">
                1
              </span>
              <div>
                <div className="font-medium">Conecte a Meta / Instagram</div>
                <p className="text-sm text-[#6B7280]">
                  Faça login na Meta e selecione seu Instagram Business. Isso libera a publicação.
                </p>
                <div className="mt-2">
                  <Button variant="outline" onClick={goRedes} className="inline-flex items-center gap-2">
                    <Network className="w-4 h-4" /> Ir para “Redes Sociais”
                  </Button>
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FFF4F0] text-[#7A2E1B] text-xs font-semibold">
                2
              </span>
              <div>
                <div className="font-medium">Configure seus SubIDs da Shopee</div>
                <p className="text-sm text-[#6B7280]">
                  Defina SubIDs por plataforma para rastrear cliques e comissões automaticamente.
                </p>
                <div className="mt-2">
                  <Button variant="outline" onClick={goPlataformas} className="inline-flex items-center gap-2">
                    <Store className="w-4 h-4" /> Ir para “Plataformas”
                  </Button>
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FFF4F0] text-[#7A2E1B] text-xs font-semibold">
                3
              </span>
              <div>
                <div className="font-medium">Busque produtos e gere legendas</div>
                <p className="text-sm text-[#6B7280]">
                  Use o dashboard para descobrir produtos, gerar legendas com IA e preparar o post.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FFF4F0] text-[#7A2E1B] text-xs font-semibold">
                4
              </span>
              <div>
                <div className="font-medium">Publique e acompanhe resultados</div>
                <p className="text-sm text-[#6B7280]">
                  Publique via Meta e acompanhe cliques/conversões pelos SubIDs e UTM.
                </p>
              </div>
            </li>
          </ol>
        </div>
        <div className="p-5 border-t border-[#FFD9CF] flex flex-col sm:flex-row items-center justify-between gap-3">
          <a href="/dashboard" className="inline-flex items-center gap-2 text-sm text-[#111827] hover:underline">
            <PlayCircle className="w-4 h-4" />
            Ir para o Dashboard
          </a>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <a href="/dashboard/perfil" className="px-4 py-2 rounded-lg text-sm bg-[#EE4D2D] hover:bg-[#D8431F] text-white">
              Ver meu Perfil
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Page ----------------------------------- */
export default function ConfiguracoesPage() {
  const [tab, setTab] = useState<TabKey>('plataformas');
  const [instagramId, setInstagramId] = useState('');
  const [tutorialOpen, setTutorialOpen] = useState(false);

  function goBack() {
    if (typeof window !== 'undefined') {
      if (window.history.length > 1) window.history.back();
      else window.location.href = '/dashboard';
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pb-10 space-y-6">
      {/* Top bar: voltar + tutorial */}
      <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button onClick={goBack} className="inline-flex items-center gap-2 text-sm text-[#111827] hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setTutorialOpen(true)}
            className="inline-flex items-center gap-2"
          >
            <BookOpenCheck className="w-4 h-4" />
            Tutorial
          </Button>
        </div>
      </div>

      {/* Título */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <Settings className="w-7 h-7 text-[#EE4D2D]" />
          Configurações
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Conecte suas plataformas e redes sociais. O que você salvar aqui será usado na busca de
          produtos e nas publicações.
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

      {/* Conteúdo */}
      {tab === 'plataformas' ? (
        <div className="grid gap-6">
          <ShopeeCredentialsCard />
          <ShopeeSubIdsCard />
        </div>
      ) : (
        <div className="grid gap-6">
          <MetaConnect onSelect={(id) => setInstagramId(id)} onSaved={(id) => setInstagramId(id)} />
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

      {/* Modal Tutorial */}
      <TutorialModal
        open={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
        goPlataformas={() => {
          setTab('plataformas');
          setTutorialOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        goRedes={() => {
          setTab('redes');
          setTutorialOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
