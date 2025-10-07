'use client';

import React from 'react';
import ComposerDrawer from './ComposerDrawer';
import { Card, CardHeader, CardBody, Button, Input, Badge } from '@/components/ui';
import { Star, Percent, TrendingUp, ChevronDown } from 'lucide-react';

type ApiItem = {
  id: string;
  title: string;
  price: number;
  rating: number;
  image: string;
  url: string;
  commissionPercent?: number; // ex.: 12 -> 12%
  commissionAmount?: number;  // ex.: 8.9 -> R$
  salesCount?: number;        // ex.: 1543
};

function formatPrice(n?: number) {
  const v = Number(n ?? 0);
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/* ===============================================
   ProductCard — comissão (%) sob a estrela (esq.)
                 vendas sob o preço (dir.)
   =============================================== */
function ProductCard({
  product,
  selected,
  onSelectAndCompose,
}: {
  product: ApiItem;
  selected?: boolean;
  onSelectAndCompose: () => void;
}) {
  // Deriva % se veio apenas o valor da comissão
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

          {/* duas colunas: esquerda (rating + comissão) | direita (preço + vendas) */}
          <div className="grid grid-cols-2 gap-2 items-start">
            {/* esquerda */}
            <div className="flex flex-col gap-1">
              <div className="inline-flex items-center gap-1 text-[#6B7280] text-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{Number(product.rating || 0).toFixed(1)}</span>
              </div>

              {typeof pct === 'number' && (
                <Badge tone="success" className="w-fit px-2 py-0.5 inline-flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  {`${Math.round(pct)}%`}
                </Badge>
              )}
            </div>

            {/* direita */}
            <div className="flex flex-col gap-1 items-end">
              <div className="text-sm font-semibold">{formatPrice(product.price)}</div>

              {typeof product.salesCount === 'number' && (
                <Badge className="w-fit px-2 py-0.5 inline-flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {`Vendas ${product.salesCount.toLocaleString('pt-BR')}`}
                </Badge>
              )}
            </div>
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

/* ===============================================
   SortSelect — menu simples com z-index alto
   =============================================== */
type SortKey =
  | 'relevance'
  | 'commission_amount_desc'
  | 'commission_percent_desc'
  | 'sales_desc'
  | 'rating_desc'
  | 'price_desc'
  | 'price_asc';

function SortSelect({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const label = {
    relevance: 'Relevância',
    commission_amount_desc: 'Comissão (R$) — maior',
    commission_percent_desc: 'Comissão (%) — maior',
    sales_desc: 'Vendas — maior',
    rating_desc: 'Avaliação — maior',
    price_desc: 'Preço — maior',
    price_asc: 'Preço — menor',
  }[value];

  return (
    <div className="relative z-40">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#FFD9CF] hover:bg-[#FFF4F0] text-sm"
      >
        {label}
        <ChevronDown className="w-4 h-4" />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 w-56 rounded-xl border border-[#FFD9CF] bg-white shadow-sm p-1 z-50"
          onMouseLeave={() => setOpen(false)}
        >
          {(
            [
              'relevance',
              'commission_amount_desc',
              'commission_percent_desc',
              'sales_desc',
              'rating_desc',
              'price_desc',
              'price_asc',
            ] as SortKey[]
          ).map((k) => (
            <button
              key={k}
              onClick={() => {
                onChange(k);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-[#FFF4F0]"
            >
              {
                {
                  relevance: 'Relevância',
                  commission_amount_desc: 'Comissão (R$) — maior',
                  commission_percent_desc: 'Comissão (%) — maior',
                  sales_desc: 'Vendas — maior',
                  rating_desc: 'Avaliação — maior',
                  price_desc: 'Preço — maior',
                  price_asc: 'Preço — menor',
                }[k]
              }
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===============================================
   Products — busca + grid + composer
   =============================================== */
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

  const [sortKey, setSortKey] = React.useState<SortKey>('relevance');

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

      // Normalizador robusto (aceita camelCase e snake_case)
      const list: ApiItem[] = (Array.isArray(data?.items) ? data.items : []).map((it: any) => {
        const id =
          it.id ??
          it.product_uid ??
          (it.shop_id != null && it.item_id != null ? `${it.shop_id}_${it.item_id}` : String(Math.random()));

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

        if (commissionPercent == null && commissionAmount != null && price > 0) {
          commissionPercent = (commissionAmount / price) * 100;
        }
        if (commissionAmount == null && commissionPercent != null && price > 0) {
          commissionAmount = (commissionPercent / 100) * price;
        }

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

  // Ordenação client-side
  const sorted = React.useMemo(() => {
    const arr = items.slice();
    const num = (v: any) => (v == null || Number.isNaN(Number(v)) ? -Infinity : Number(v));

    switch (sortKey) {
      case 'commission_amount_desc':
        arr.sort((a, b) => num(b.commissionAmount) - num(a.commissionAmount));
        break;
      case 'commission_percent_desc':
        arr.sort((a, b) => num(b.commissionPercent) - num(a.commissionPercent));
        break;
      case 'sales_desc':
        arr.sort((a, b) => num(b.salesCount) - num(a.salesCount));
        break;
      case 'rating_desc':
        arr.sort((a, b) => num(b.rating) - num(a.rating));
        break;
      case 'price_desc':
        arr.sort((a, b) => num(b.price) - num(a.price));
        break;
      case 'price_asc':
        arr.sort((a, b) => num(a.price) - num(b.price));
        break;
      default:
        // relevance: mantém ordem original
        break;
    }
    return arr;
  }, [items, sortKey]);

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader
          title="Filtrar/Buscar"
          subtitle="Digite o que procura e clique em Buscar para carregar os produtos."
          right={
            <div className="flex items-center gap-2">
              <SortSelect value={sortKey} onChange={setSortKey} />
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
          <CardBody className="text-sm text-[#6B7280]">Faça uma busca para listar produtos.</CardBody>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sorted.map((p) => (
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
