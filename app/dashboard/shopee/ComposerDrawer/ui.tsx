// app/dashboard/shopee/ComposerDrawer/ui.tsx
'use client';

import * as React from 'react';
import { Check, Copy, Loader2 } from 'lucide-react';
import type { Product, PlatformKey } from './utils';
import { cx } from './utils';

/* ========================= base card ========================= */
export function SectionCard({
  className = '',
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-[#FFD9CF] bg-white/80 backdrop-blur p-3 md:p-4',
        className
      )}
    >
      {children}
    </div>
  );
}

/* ========================= product summary ========================= */
export function ProductSummary({ product }: { product: Product }) {
  return (
    <SectionCard>
      <div className="flex gap-3">
        <img src={product.image} alt="" className="w-20 h-20 rounded object-cover border" />
        <div className="min-w-0">
          <div className="font-medium line-clamp-2">{product.title}</div>
          {typeof product.price === 'number' && (
            <div className="text-sm text-gray-600">R$ {Number(product.price).toFixed(2)}</div>
          )}
          <div className="text-xs text-gray-500">ID: {product.id}</div>
        </div>
      </div>
    </SectionCard>
  );
}

/* ========================= platform selector ========================= */
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
            'px-3 py-1.5 rounded-lg border text-sm',
            value === p
              ? 'bg-[#EE4D2D] text-white border-[#EE4D2D]'
              : 'bg-white border-[#FFD9CF] hover:bg-[#FFF4F0]'
          )}
          disabled={!!disabled}
        >
          {p === 'x' ? 'X (Twitter)' : p[0].toUpperCase() + p.slice(1)}
        </button>
      ))}
    </div>
  );
}

/* ========================= copy button ========================= */
function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
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

/* ========================= link box ========================= */
export function LinkBox({ trackedUrl, busy }: { trackedUrl: string; busy: boolean }) {
  return (
    <SectionCard>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium">Link rastreável</div>
        {busy ? (
          <span className="inline-flex items-center gap-1 text-xs text-[#6B7280]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando…
          </span>
        ) : trackedUrl ? (
          <CopyButton text={trackedUrl} />
        ) : null}
      </div>
      <input
        className="mt-2 w-full border border-[#FFD9CF] rounded-lg px-3 py-2 text-sm bg-white"
        value={trackedUrl}
        readOnly
        placeholder={busy ? 'Gerando…' : 'Sem link ainda'}
      />
      <p className="mt-1 text-[11px] text-[#6B7280]">
        Usado na publicação e salvo no banco para relatórios.
      </p>
    </SectionCard>
  );
}

/* ========================= schedule box ========================= */
export function ScheduleBox({
  mode,
  setMode,
  date,
  time,
  setDate,
  setTime,
  minDate,
  minTimeHint,
  tzLabel,
}: {
  mode: 'now' | 'schedule';
  setMode: (m: 'now' | 'schedule') => void;
  date: string;
  time: string;
  setDate: (v: string) => void;
  setTime: (v: string) => void;
  minDate: string;
  minTimeHint: string;
  tzLabel: string;
}) {
  return (
    <SectionCard className="space-y-3">
      <div className="text-sm font-medium">Publicação</div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setMode('now')}
          className={cx(
            'px-3 py-1.5 rounded-lg border text-sm',
            mode === 'now'
              ? 'bg-[#EE4D2D] text-white border-[#EE4D2D]'
              : 'bg-white border-[#FFD9CF] hover:bg-[#FFF4F0]'
          )}
        >
          Publicar agora
        </button>
        <button
          onClick={() => setMode('schedule')}
          className={cx(
            'px-3 py-1.5 rounded-lg border text-sm',
            mode === 'schedule'
              ? 'bg-[#111827] text-white border-[#111827]'
              : 'bg-white border-[#FFD9CF] hover:bg-[#FFF4F0]'
          )}
        >
          Agendar
        </button>
      </div>

      {mode === 'schedule' && (
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Dia</label>
              <input
                type="date"
                className="mt-1 w-full border border-[#FFD9CF] rounded-lg px-3 py-2 text-sm"
                min={minDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Horário</label>
              <input
                type="time"
                className="mt-1 w-full border border-[#FFD9CF] rounded-lg px-3 py-2 text-sm"
                step={300} // 5 min
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <p className="text-[11px] text-[#6B7280]">
            Será convertido para UTC ao enviar. Seu fuso: <b>{tzLabel}</b>. Sugestão mínima de horário hoje: <b>{minTimeHint}</b>.
          </p>
        </div>
      )}
    </SectionCard>
  );
}

/* ========================= caption editor ========================= */
export function CaptionEditor({
  caption,
  setCaption,
  placeholder,
}: {
  caption: string;
  setCaption: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <SectionCard className="space-y-2">
      <div className="text-sm font-medium">Legenda</div>
      <textarea
        className="w-full border border-[#FFD9CF] rounded-lg p-2 text-sm"
        rows={10}
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder={placeholder || 'Escreva ou cole sua legenda…'}
      />
    </SectionCard>
  );
}
