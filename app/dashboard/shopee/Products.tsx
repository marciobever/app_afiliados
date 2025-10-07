'use client';

import React from 'react';
import ComposerDrawer from './ComposerDrawer';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Badge,
} from '@/components/ui';
import { Star, Percent, TrendingUp } from 'lucide-react';

type ApiItem = {
  id: string;
  title: string;
  price: number;
  rating: number;
  image: string;
  url: string;
  commissionPercent?: number; // 12 => 12%
  commissionAmount?: number;  // 8.9 => R$
  salesCount?: number;        // 1543
};

function formatPrice(n?: number) {
  const v = Number(n ?? 0);
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatPercent(n?: number) {
  const v = Number(n ?? 0);
  return `${Math.round(v)}%`;
}
function fmtVendas(n?: number) {
  const v = Number(n ?? 0);
  return `Vendas ${v.toLocaleString('pt-BR')}`;
}

/* ============================ CARD ================================== */
function ProductCard({
  product,
  selected,
  onSelectAndCompose,
}: {
  product: ApiItem;
  selected?: boolean;
  onSelectAndCompose: () => void;
}) {
  // somente % no chip verde; se vier só valor, deriva % pelo preço
  const pct =
    product.commissionPercent ??
    (product.commissionAmount != null && product.price > 0
      ? (product.commissionAmount / product.price) * 100
      : undefined);

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
            <div className="text-sm font-semibold">{formatPrice(product.price)}</div>
          </div>

          {/* chips compactos alinhados à direita, mesma linha */}
          <div className="mt-1 flex items-center justify-end gap-2">
            {typeof pct === 'number' && (
              <Badge tone="success" className="px-2 py-0.5 inline-flex items-center gap-1">
                <Percent className="w-3 h-3" />
                {formatPercent(pct)}
              </Badge>
            )}

            {typeof product.salesCount === 'number' && (
              <Badge className="px-2 py-0.5 inline-flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {fmtVendas(product.salesCount)}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={onSelectAndCompose} className="flex-1">
            {selected ? 'Selecionado • Editar' : 'Selecionar'}
          </Button>
          <a href={product.url} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button variant="outline" className="w-full">
              Ver na Shopee
            </Button>
          </a>
        </div>
      </CardBody>
    </Card>
  );
}

/* ============================ LISTA ================================== */
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

  const [composerOpen, setComposerOpen] = React.useState(false);
  const [composerProduct, setComposerProduct] = React.useState<ApiItem | null>(null);

  // ordenação local (apenas reordena o array já carregado)
  type SortKey =
    | 'relevance'
    | 'commission_amount_desc'
    | 'commission_percent_desc'
    | 'sales_desc'
    | 'rating_desc'
    | 'price_desc'
    | 'price_asc';
  const [sortBy, setSortBy] = React.useState<SortKey>('relevance');

  function sortItems(list: ApiItem[], by: SortKey) {
    const arr = list.slice();
    switch (by) {
      case 'commission_amount_desc':
        return arr.sort(
          (a, b) =>
            (b.commissionAmount ?? (b.commissionPercent ?? 0) * b.price / 100) -
            (a.commissionAmount ?? (a.commissionPercent ?? 0) * a.price / 100)
        );
      case 'commission_percent_desc':
        return arr.sort(
          (a, b) =>
            (b.commissionPercent ??
              (b.commissionAmount != null && b.price > 0 ? (b.commissionAmount / b.price) * 100 : -1)) -
            (a.commissionPercent ??
              (a.commissionAmount != null && a.price > 0 ? (a.commissionAmount / a.price) * 100 : -1))
        );
      case 'sales_desc':
        return arr.sort((a, b) => (b.salesCount ?? -1) - (a.salesCount ?? -1));
      case 'rating_desc':
        return arr.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
      case 'price_desc':
        return arr.sort((a, b) => b.price - a.price);
      case 'price_asc':
        return arr.sort((a, b) => a.price - b.price);
      default:
        return arr; // relevance: mantém a ordem da resposta
    }
  }

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

      // normaliza itens (aceita camelCase/snake_case)
      const list: ApiItem[] = (Array.isArray(data?.items) ? data.items : []).map((it: any) => {
        const id =
          it.id ??
          it.product_uid ??
          (it.shop_id != null && it.item_id != null
            ? `${it.shop_id}_${it.item_id}`
            : String(Math.random()));

        const title = it.title ?? it.nome ?? it.name ?? '';
        const price = Number(it.price ?? it.preco_min ?? it.preco ?? it.sale_price ?? it.price_min ?? 0);
        const rating = Number(it.rating ?? it.avaliacao ?? it.item_rating?.rating_star ?? 0);

        const image =
          it.image ??
          it.image_url ??
          (Array.isArray(it.images) && it.images[0] ? it.images[0] : '') ??
          '';

        const url = it.url ?? it.offer_link ?? it.product_link ?? `https://shopee.com.br/product/${id}`;

        let commissionAmount =
          it.commissionAmount ??
          it.commission_amount ??
          it.comissao ??
          it.max_commission_amount ??
          it.commission_value;

        let commissionPercent =
          it.commissionPercent ??
          it.commission_percent ??
          it.commission_rate ??
          it.max_commission_rate;

        commissionAmount = commissionAmount != null ? Number(commissionAmount) : undefined;
        commissionPercent = commissionPercent != null ? Number(commissionPercent) : undefined;

        const salesRaw =
          it.salesCount ?? it.sales_count ?? it.vendas ?? it.historical_sold ?? it.sold ?? it.sales;
        const salesCount = salesRaw != null ? Number(salesRaw) : undefined;

        return {
          id: String(id),
          title,
          price,
          rating,
          image,
          url,
          commissionPercent,
          commissionAmount,
          salesCount,
        } as ApiItem;
      });

      const sorted = sortItems(list, sortBy);
      setItems(sorted);

      setProductsMap((prev) => {
        const next = { ...prev };
        sorted.forEach((p) => (next[p.id] = p));
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

  // quando trocar o sort, reordena o que já está na tela
  React.useEffect(() => {
    if (items.length) setItems(sortItems(items, sortBy));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader
          title="Filtrar/Buscar"
          subtitle="Digite o que procura e clique em Buscar para carregar os produtos."
          right={
            <div className="flex items-center gap-2 relative z-50">
              <select
                className="border border-[#FFD9CF] rounded-lg px-3 py-2 text-sm bg-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Ordenar por"
              >
                <option value="relevance">Relevância</option>
                <option value="commission_amount_desc">Comissão (R$) — maior</option>
                <option value="commission_percent_desc">Comissão (%) — maior</option>
                <option value="sales_desc">Vendas — maior</option>
                <option value="rating_desc">Avaliação — maior</option>
                <option value="price_desc">Preço — maior</option>
                <option value="price_asc">Preço — menor</option>
              </select>
              <Button onClick={runSearch} disabled={loading}>
                {loading ? 'Buscando…' : 'Buscar'}
              </Button>
            </div>
          }
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
        {items.map((p) => (
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
