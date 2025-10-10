'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, CreditCard, Loader2, User } from 'lucide-react';
import Link from 'next/link';

/* ------------------------- Tipos ------------------------- */
type Me =
  | { ok: true; session: { userId: string; orgId: string }; profile: { id: string; email: string; name?: string | null } }
  | { ok: false; error?: string };

type Plan = {
  code: string;               // 'starter' | 'pro' | 'business' | 'trial' | etc
  label: string;              // 'Starter', 'Pro'...
  status: string;             // 'active' | 'trialing' | 'canceled' | ...
  renews_at?: string | null;  // ISO date
  trial_ends_at?: string | null;
};
type PlanResp = { ok: true; plan: Plan | null } | { ok: false; error?: string };

type Invoice = {
  id: string;
  number?: string | null;
  created_at?: string | null;     // ISO
  amount?: number | null;         // em centavos
  currency?: string | null;       // 'BRL'
  status?: string | null;         // 'paid' | 'open' | ...
  hosted_invoice_url?: string | null;
};
type InvoicesResp = { ok: true; invoices: Invoice[] } | { ok: false; error?: string };

/* ------------------------- Helpers ----------------------- */
function realBRL(cents?: number | null, currency = 'BRL') {
  if (cents == null) return '—';
  try {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency });
  } catch {
    return `R$ ${(cents / 100).toFixed(2)}`;
  }
}
function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(+d) ? '—' : d.toLocaleDateString('pt-BR');
}

/* ------------------------- UI átomos --------------------- */
function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return <section {...props} className={`rounded-2xl border border-[#FFD9CF] bg-white shadow-sm ${props.className || ''}`} />;
}
function CardHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="p-5 border-b border-[#FFD9CF] flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 className="font-semibold text-base">{title}</h3>
        {subtitle ? <p className="text-sm text-[#6B7280] mt-0.5">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}
function CardBody(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`p-5 ${props.className || ''}`} />;
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`border border-[#FFD9CF] rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D] ${props.className || ''}`}
    />
  );
}
function Button({
  children,
  variant = 'primary',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' }) {
  const styles =
    variant === 'primary'
      ? 'bg-[#EE4D2D] hover:bg-[#D8431F] text-white'
      : 'border border-[#FFD9CF] hover:bg-[#FFF4F0] text-[#111827]';
  return (
    <button
      {...rest}
      className={`px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles} ${rest.className || ''}`}
    >
      {children}
    </button>
  );
}

/* ------------------------- Página Perfil ----------------- */
export default function PerfilPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [plan, setPlan] = useState<PlanResp | null>(null);
  const [invoices, setInvoices] = useState<InvoicesResp | null>(null);

  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Carrega dados
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [rMe, rPlan, rInv] = await Promise.all([
          fetch('/api/auth/me', { cache: 'no-store' }),
          fetch('/api/account/plan', { cache: 'no-store' }),
          fetch('/api/billing/invoices', { cache: 'no-store' }),
        ]);
        const [jMe, jPlan, jInv] = (await Promise.all([rMe.json(), rPlan.json(), rInv.json()])) as [
          Me,
          PlanResp,
          InvoicesResp
        ];
        if (!alive) return;
        setMe(jMe);
        setPlan(jPlan);
        setInvoices(jInv);
        if ((jMe as any).ok) setName(((jMe as any).profile?.name || '').trim());
      } catch {
        if (!alive) return;
        setMe({ ok: false, error: 'fetch_error' });
        setPlan({ ok: false, error: 'fetch_error' });
        setInvoices({ ok: false, error: 'fetch_error' });
      }
    })();
    return () => { alive = false; };
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      const r = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || null }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || 'Erro ao salvar');
      setMsg('Perfil atualizado!');
    } catch (e: any) {
      setMsg(e?.message || 'Falha ao atualizar');
    } finally {
      setSaving(false);
    }
  }

  async function openBillingPortal() {
    try {
      const r = await fetch('/api/billing/portal', { method: 'POST' });
      const j = await r.json();
      if (r.ok && j?.url) {
        window.location.href = j.url;
      } else {
        alert(j?.error || 'Portal de cobrança não configurado.');
      }
    } catch {
      alert('Portal de cobrança indisponível.');
    }
  }

  const planObj = (plan && (plan as any).ok ? (plan as any).plan : null) as Plan | null;

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12 space-y-6">
      {/* Topo */}
      <div className="pt-4 sm:pt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User className="w-7 h-7 text-[#EE4D2D]" />
          <h1 className="text-2xl sm:text-3xl font-bold">Perfil</h1>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm rounded-lg border border-[#FFD9CF] px-3 py-2 hover:bg-[#FFF4F0]"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
      </div>

      {/* Seu perfil */}
      <Card>
        <CardHeader title="Seus dados" subtitle="Essas informações identificam sua conta no app." />
        <CardBody>
          <form onSubmit={saveProfile} className="grid gap-4 max-w-xl">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#374151]">Nome</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#374151]">E-mail</label>
              <Input value={(me as any)?.ok ? (me as any).profile?.email : ''} disabled />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando…
                  </span>
                ) : (
                  'Salvar'
                )}
              </Button>
              {msg && <span className="text-sm text-[#6B7280]">{msg}</span>}
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Plano / assinatura */}
      <Card>
        <CardHeader
          title="Assinatura"
          subtitle="Seu plano atual e informações de cobrança."
          right={
            planObj ? (
              <span className="inline-flex items-center gap-2 text-xs text-green-700">
                <CheckCircle2 className="w-4 h-4" />
                {planObj.status === 'trialing' ? 'Em teste' : 'Ativa'}
              </span>
            ) : null
          }
        />
        <CardBody>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-[#6B7280]">Plano</div>
              <div className="text-lg font-semibold">{planObj?.label ?? 'Starter (gratuito)'}</div>
              <div className="mt-2 text-sm text-[#6B7280]">
                {planObj?.status === 'trialing' && planObj?.trial_ends_at
                  ? `Período de teste até ${fmtDate(planObj.trial_ends_at)}`
                  : planObj?.renews_at
                  ? `Próxima renovação: ${fmtDate(planObj.renews_at)}`
                  : 'Sem ciclo de cobrança configurado'}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-[#EE4D2D] mt-0.5" />
              <div className="space-y-2">
                <div className="text-sm text-[#6B7280]">Gerenciar cobrança</div>
                <div className="flex gap-2">
                  <Button onClick={openBillingPortal}>Gerenciar assinatura</Button>
                  <Link
                    href="/precos"
                    className="px-4 py-2 rounded-lg text-sm border border-[#FFD9CF] hover:bg-[#FFF4F0] text-[#111827]"
                  >
                    Alterar plano
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Faturas */}
      <Card>
        <CardHeader title="Faturas" subtitle="Histórico de cobranças" />
        <CardBody>
          {invoices && (invoices as any).ok && (invoices as any).invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#6B7280]">
                    <th className="py-2 pr-4">Número</th>
                    <th className="py-2 pr-4">Data</th>
                    <th className="py-2 pr-4">Valor</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(invoices as any).invoices.map((inv: Invoice) => (
                    <tr key={inv.id}>
                      <td className="py-2 pr-4">{inv.number || inv.id.slice(0, 10)}</td>
                      <td className="py-2 pr-4">{fmtDate(inv.created_at)}</td>
                      <td className="py-2 pr-4">{realBRL(inv.amount, inv.currency || 'BRL')}</td>
                      <td className="py-2 pr-4">{inv.status || '—'}</td>
                      <td className="py-2">
                        {inv.hosted_invoice_url ? (
                          <a
                            href={inv.hosted_invoice_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#EE4D2D] hover:underline"
                          >
                            Ver
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[#6B7280]">Nenhuma fatura encontrada.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
