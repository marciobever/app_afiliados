// app/dashboard/shopee/ComposerDrawer/ui.tsx
'use client';

import React from 'react';
import { Copy, Check, CalendarClock } from 'lucide-react';
import { cx, Product, PlatformKey, deriveShopeeIdFromUrl } from './utils';

export function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={cx('rounded-2xl border border-[#FFD9CF] p-3', className)}>{children}</div>;
}

export function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [ok, setOk] = React.useState(false);
  return (
    <button
      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#FFD9CF] hover:bg-[#FFF4F0] text-xs disabled:opacity-50"
      onClick={async () => {
        await navigator.clipboard.writeText(text || '');
        setOk(true);
        setTimeout(() => setOk(false), 900);
      }}
      disabled={!text}
    >
      {ok ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {ok ? 'Copiado' : label}
    </button>
  );
}

export function ProductSummary({ product }: { product: Product }) {
  return (
    <SectionCard>
      <div className="flex gap-3">
        <img src={product.image} alt="" className="w-20 h-20 rounded object-cover" />
        <div className="min-w-0">
          <div className="font-medium line-clamp-2">{product.title}</div>
          {typeof product.price === 'number' && (
            <div className="text-sm text-gray-600">R$ {Number(product.price).toFixed(2)}</div>
          )}
          <div className="text-xs text-gray-500">
            ID: {product.id || deriveShopeeIdFromUrl(product.url)}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

export function PlatformSelector({
  platforms,
  value,
  onChange,
  disabled,
  className = '',
}: {
  platforms: PlatformKey[];
  value: PlatformKey;
  onChange: (p: PlatformKey) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cx('flex gap-2 flex-wrap', className)}>
      {platforms.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cx(
            'px-3 py-1.5 rounded-full border text-xs',
            value === p ? 'bg-[#EE4D2D] text-white border-[#EE4D2D]' : 'bg-white border-[#FFD9CF] hover:bg-[#FFF4F0]'
          )}
          disabled={disabled}
          title={`Plataforma: ${p}`}
        >
          {p === 'x' ? 'X' : p[0].toUpperCase() + p.slice(1)}
        </button>
      ))}
    </div>
  );
}

export function LinkBox({
  trackedUrl,
  busy,
}: {
  trackedUrl: string;
  busy: boolean;
}) {
  return (
    <SectionCard className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Link rastreável</div>
        {trackedUrl ? <CopyButton text={trackedUrl} label="Copiar link" /> : null}
      </div>
      <div className="text-xs text-[#6B7280]">
        {busy ? 'Gerando link…' : trackedUrl ? 'Pronto.' : 'Sem link ainda.'}
      </div>
      <input
        className="w-full mt-2 border border-[#FFD9CF] rounded-lg px-3 py-2 text-sm"
        value={trackedUrl}
        readOnly
      />
    </SectionCard>
  );
}

export function ScheduleBox({
  mode,
  setMode,
  dtLocal,
  setDtLocal,
  minDt,
  className = '',
}: {
  mode: 'now' | 'schedule';
  setMode: (m: 'now' | 'schedule') => void;
  dtLocal: string;
  setDtLocal: (v: string) => void;
  minDt: string;
  className?: string;
}) {
  return (
    <SectionCard className={cx('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Publicação</div>
        <div className="text-[11px] text-[#6B7280] flex items-center gap-1">
          <CalendarClock className="w-3.5 h-3.5" />
          Fuso local do navegador
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className={cx(
            'flex-1 px-3 py-2 rounded-lg border text-sm',
            mode === 'now' ? 'bg-[#EE4D2D] text-white border-[#EE4D2D]' : 'bg-white border-[#FFD9CF] hover:bg-[#FFF4F0]'
          )}
          onClick={() => setMode('now')}
        >
          Publicar agora
        </button>
        <button
          className={cx(
            'flex-1 px-3 py-2 rounded-lg border text-sm',
            mode === 'schedule' ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white border-[#FFD9CF] hover:bg-[#FFF4F0]'
          )}
          onClick={() => setMode('schedule')}
        >
          Agendar
        </button>
      </div>

      {mode === 'schedule' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Data e horário</label>
          <input
            type="datetime-local"
            className="w-full border border-[#FFD9CF] rounded-lg px-3 py-2 text-sm"
            value={dtLocal}
            min={minDt}
            onChange={(e) => setDtLocal(e.target.value)}
          />
        </div>
      )}
    </SectionCard>
  );
}

export function CaptionEditor({
  caption,
  setCaption,
  busyCaption,
  hint,
}: {
  caption: string;
  setCaption: (v: string) => void;
  busyCaption: boolean;
  hint?: string;
}) {
  return (
    <SectionCard className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Legenda</div>
        <CopyButton text={caption} label="Copiar legenda" />
      </div>
      {busyCaption && <div className="text-[11px] text-[#EE4D2D]">gerando…</div>}
      <textarea
        className="w-full border border-[#FFD9CF] rounded-lg p-2 text-sm min-h-[220px]"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder={hint || 'Escreva sua legenda…'}
      />
      <p className="text-[11px] text-[#6B7280]">No Instagram, o link é tratado fora da legenda (shortlink).</p>
    </SectionCard>
  );
}
