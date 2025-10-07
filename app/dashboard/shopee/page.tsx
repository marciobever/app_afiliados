'use client';

import React from 'react';
import { ShoppingCart, Clock } from 'lucide-react';
import { Tabs, SectionHeader } from '@/components/ui';
import Products from './Products';
import History from './History';

type Tab = 'produtos' | 'historico';

export default function ShopeeDashboardPage() {
  const [tab, setTab] = React.useState<Tab>('produtos');

  const [selected, setSelected] = React.useState<string[]>([]);
  const [productsMap, setProductsMap] = React.useState<Record<string, any>>({});

  return (
    <main className="p-6 space-y-6 max-w-6xl mx-auto">
      <SectionHeader
        emoji="🛒"
        title="Shopee — Painel de Conteúdo"
        subtitle="Selecione produtos e gere legendas automáticas com CTA para Facebook ou Instagram."
      />

      <div>
        <Tabs<Tab>
          value={tab}
          onChange={setTab}
          tabs={[
            { key: 'produtos', label: 'Produtos', icon: <ShoppingCart className="w-4 h-4" /> },
            { key: 'historico', label: 'Histórico', icon: <Clock className="w-4 h-4" /> },
          ]}
        />
      </div>

      {tab === 'produtos' && (
        <Products
          selected={selected}
          setSelected={setSelected}
          productsMap={productsMap}
          setProductsMap={setProductsMap}
        />
      )}

      {tab === 'historico' && <History market="shopee" />}
    </main>
  );
}
