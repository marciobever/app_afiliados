'use client';

import React from 'react';
import ComposerDrawer from './ComposerDrawer';
import { Card, CardHeader, CardBody, Button, Input, Badge } from '@/components/ui';
import { Star, Percent, TrendingUp } from 'lucide-react';

type ApiItem = {
  id: string;
  title: string;
  price: number;
  rating: number;
  image: string;
  url: string;
  commissionPercent?: number; // ex: 12 (=> 12%)
  commissionAmount?: number;  // ex: 8.9 (R$)
  salesCount?: number;        // ex: 1543
};

type SortKey =
  | 'relevance'
  | 'commission_amount'
  | 'commission_percent'
  | 'sales'
  | 'rating'
  | 'price_asc'
  | 'price_desc';

function formatPrice(n?: number) {
  const v = Number(n ?? 0);
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatPercent(n?: number) {
  const v = Number(n ?? 0);
  return `${v.toFixed(0)}%`;
}
function deriveCommission(price: number, percent?: number, amount?: number) {
  const p = Number(price || 0);
  let pct = typeof percent === 'number' ? percent : undefined;
  let amt = typeof amount === 'number' ? amount : undefined;
  if (pct == null && amt != null && p > 0) pct = (amt / p) * 100;
  if (amt == null && pct != null && p > 0) amt = (pct / 100) * p;
  return { pct: pct != null ? Number(pct) : undefined, amt: amt != null ? Number(amt) : undefined };
}

/** Card de produto */
function ProductCard({
  product,
  selected,
  onSelectAndCompose,
}: {
  product: ApiItem;
  selected?: boolean;
  onSelectAndCompose: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-[4/3] bg-[#FFF9F7] border-b border-[#FFD9CF]">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      <CardBody className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-[#111827] line-clamp-2">
            {product.title}
          </h3>

          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1 text-[#6B7280] text-sm">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{Number(product.rating || 0).toFixed(1)}</span>
            </div>
            <div className="text-sm font-semibold">
              {formatPrice(product.price)}
            </div>
          </div>

          {/* badges: comissão + vendas */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {typeof product.commissionAmount === 'number' ? (
              <Badge tone="success" className="inline-flex items-center gap-1">
                <Percent className="w-3 h-3" />
                Comissão {formatPrice(product.commissionAmount)}
              </Badge>
            ) : typeof product.commissionPercent === 'number' ? (
              <Badge tone="success" className="inline-flex items-center gap-1">
                <Percent className="w-3 h-3" />
                Comissão {formatPercent(product.commissionPercent)}
              </Badge>
            ) : null}

            {typeof product.salesCount === 'number' ? (
              <Badge className="inline-flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {product.salesCount.toLocaleString('pt-BR')} vendas
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={onSelectAndCompose} className="flex-1">
            {selected ? 'Selecionado • Editar' : 'Selecionar'}
          </Button>
          <a href={product.url} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button variant="outline" className="w-full">Ver na Shopee</Button>
          </a>
        </div>
      </CardBody>
    </Card>
  );
}

export default function Products({
  selected,
  setSelected,
  productsMap,
  setProductsMap,
}: {
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  productsMap: Record<string, ApiItem>;
  setProductsMap: React.Dispatch<React.SetStateAction<Record<string, ApiItem>>>;
}) {
  const [query, setQuery] = React.useState('');
  const [items, setItems] = React.useState<ApiItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  // novos filtros/ordenação
  const [sortKey, setSortKey] = React.useState<SortKey>('relevance');
  const [minCommissionPct, setMinCommissionPct] = React.useState<number>(0);
  const [minSales, setMinSales] = React.useState<number>(0);

  const [composerOpen, setComposerOpen] = React.useState(false);
  const [composerProduct, setComposerProduct] = React.useState<ApiItem | null>(null);

  async function runSearch() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/search/shopee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query || 'liquidificador',
          filters: { limit: 24 },
          sort: 'relevance',
          country: 'BR',
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();

      // normalizador + derivação de comissão
      const list: ApiItem[] = (Array.isArray(data?.items) ? data.items : []).map((it: any) => {
        const id = it.id ?? it.itemid ?? it.itemId ?? String(Math.random());
        const title = it.title ?? it.name ?? '';
        const price = Number(it.price ?? it.sale_price ?? it.price_min ?? 0);
        const rating = Number(it.rating ?? it.item_rating?.rating_star ?? 0);
        const image =
          it.image ??
          (Array.isArray(it.images) && it.images[0] ? it.images[0] : '') ??
          '';
        const url = it.url ?? it.link ?? `https://shopee.com.br/product/${id}`;

        const commissionPercent = it.commissionPercent ?? it.max_commission_rate ?? it.commission_rate;
        const commissionAmount  = it.commissionAmount  ?? it.max_commission_amount ?? it.commission_value;
        const salesCount = it.salesCount ?? it.historical_sold ?? it.sold;

        const { pct, amt } = deriveCommission(price, commissionPercent, commissionAmount);

        return {
          id: String(id),
          title,
          price,
          rating,
          image,
          url,
          commissionPercent: pct,
          commissionAmount: amt,
          salesCount: salesCount != null ? Number(salesCount) : undefined,
        } as ApiItem;
      });

      setItems(list);
      setProductsMap((prev) => {
        const next = { ...prev };
        list.forEach((p) => (next[p.id] = p));
        return next;
      });
    } catch (e: any) {
      setErr(e?.message || 'Erro ao buscar');
    } finally {
      setLoading(false);
    }
  }

  function selectAndOpen(p: ApiItem) {
    setSelected((s) => (s.includes(p.id) ? s : [...s, p.id]));
    setComposerProduct(p);
    setComposerOpen(true);
  }

  const filteredSorted = React.useMemo(() => {
    const arr = items
      .map((p) => {
        const { pct, amt } = deriveCommission(p.price, p.commissionPercent, p.commissionAmount);
        return { ...p, commissionPercent: pct, commissionAmount: amt };
      })
      .filter((p) => {
        const pct = p.commissionPercent ?? 0;
        const sales = p.salesCount ?? 0;
        const pctOk = pct >= (minCommissionPct || 0);
        const salesOk = sales >= (minSales || 0);
        return pctOk && salesOk;
      });

    const by = (k: SortKey) => {
      switch (k) {
        case 'commission_amount':
          return arr.sort((a, b) => (b.commissionAmount ?? 0) - (a.commissionAmount ?? 0));
        case 'commission_percent':
          return arr.sort((a, b) => (b.commissionPercent ?? 0) - (a.commissionPercent ?? 0));
        case 'sales':
          return arr.sort((a, b) => (b.salesCount ?? 0) - (a.salesCount ?? 0));
        case 'rating':
          return arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        case 'price_asc':
          return arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        case 'price_desc':
          return arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        case 'relevance':
        default:
          return arr; // mantém a ordem vinda do backend
      }
    };

    return by(sortKey).slice();
  }, [items, sortKey, minCommissionPct, minSales]);

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader
          title="Filtrar/Buscar"
          subtitle="Busque produtos e refine por comissão e vendas."
          right={<Button onClick={runSearch} disabled={loading}>{loading ? 'Buscando…' : 'Buscar'}</Button>}
        />
        <CardBody>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Buscar por título…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            />
          </div>

          {/* filtros/ordenação extras */}
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-[#374151] mb-1 block">Ordenar por</label>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="border border-[#FFD9CF] rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D]"
              >
                <option value="relevance">Relevância (padrão)</option>
                <option value="commission_amount">Maior comissão (R$)</option>
                <option value="commission_percent">Maior comissão (%)</option>
                <option value="sales">Mais vendas</option>
                <option value="rating">Maior avaliação</option>
                <option value="price_asc">Preço: menor → maior</option>
                <option value="price_desc">Preço: maior → menor</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-[#374151] mb-1 block">Comissão mínima (%)</label>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step={1}
                placeholder="ex.: 10"
                value={Number.isFinite(minCommissionPct) ? minCommissionPct : 0}
                onChange={(e) => setMinCommissionPct(Number(e.target.value || 0))}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#374151] mb-1 block">Vendas mínimas</label>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                placeholder="ex.: 50"
                value={Number.isFinite(minSales) ? minSales : 0}
                onChange={(e) => setMinSales(Number(e.target.value || 0))}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {err && (
        <div className="p-3 rounded-lg border border-[#FFD9CF] bg-[#FFF4F0] text-[#B42318] text-sm">
          {err}
        </div>
      )}

      {!loading && !err && items.length === 0 && (
        <Card>
          <CardBody className="text-sm text-[#6B7280]">
            Faça uma busca para listar produtos.
          </CardBody>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredSorted.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            selected={selected.includes(p.id)}
            onSelectAndCompose={() => selectAndOpen(p)}
          />
        ))}
      </div>

      <ComposerDrawer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        product={composerProduct}
      />
    </section>
  );
}
