'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import Products from './Products';
import Designer from './Designer';

function Tabs({
  value,
  onChange,
}: {
  value: 'produtos' | 'designer' | 'reels' | 'tirinhas';
  onChange: (v: 'produtos' | 'designer' | 'reels' | 'tirinhas') => void;
}) {
  const tabs: Array<{ key: typeof value; label: string }> = [
    { key: 'produtos', label: 'Produtos' },
    { key: 'designer', label: 'Designer (Feed)' },
    { key: 'reels', label: 'Reels' },
    { key: 'tirinhas', label: 'Tirinhas' },
  ];
  return (
    <div className="w-full">
      <div className="grid grid-cols-4 w-full md:w-[720px] rounded-xl overflow-hidden border border-[#FFD9CF] bg-white">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={[
              'px-4 py-2 text-sm font-medium border-r last:border-r-0 transition-colors',
              'border-[#FFD9CF]',
              value === t.key
                ? 'bg-[#EE4D2D] text-white'
                : 'bg-white text-[#111827] hover:bg-[#FFF4F0]',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ShopeeDashboardPage() {
  const [tab, setTab] = React.useState<'produtos' | 'designer' | 'reels' | 'tirinhas'>('produtos');

  // seleção e mapa de produtos ficam no nível da página para serem compartilhados
  const [selected, setSelected] = React.useState<string[]>([]);
  const [productsMap, setProductsMap] = React.useState<Record<string, any>>({});

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-[#111827]">
          <ShoppingCart className="w-6 h-6 text-[#EE4D2D]" /> Shopee — Painel de Conteúdo
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Curadoria de produtos → criação de assets para Facebook/Instagram (feed), Reels e Tirinhas.
        </p>
      </div>

      <Tabs value={tab} onChange={setTab} />

      {tab === 'produtos' && (
        <Products
          selected={selected}
          setSelected={setSelected}
          productsMap={productsMap}
          setProductsMap={setProductsMap}
        />
      )}

      {tab === 'designer' && (
        <Designer selected={selected} productsMap={productsMap} />
      )}

      {/* Reels / Tirinhas podem vir depois no mesmo padrão de modularização */}
    </main>
  );
}
