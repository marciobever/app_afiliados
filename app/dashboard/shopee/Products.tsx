'use client';

import React from 'react';
import ReactDOM from 'react-dom';
import ComposerDrawer from './ComposerDrawer';
import { Card, CardHeader, CardBody, Button, Input, Badge } from '@/components/ui';
import { Star, Percent, TrendingUp, ChevronDown, Check } from 'lucide-react';

/* ------------------------------- Tipagens ------------------------------- */
type ApiItem = {
  id: string;
  title: string;
  price: number;
  rating: number;
  image: string;
  url: string;
  commissionPercent?: number;
  commissionAmount?: number;
  salesCount?: number;
};

/* --------------------------------- Utils -------------------------------- */
function formatPrice(n?: number) {
  const v = Number(n ?? 0);
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatPercent(n?: number) {
  const v = Number(n ?? 0);
  return `${v.toFixed(0)}%`;
}

function commissionAmountOf(p: ApiItem) {
  if (typeof p.commissionAmount === 'number') return p.commissionAmount;
  if (typeof p.commissionPercent === 'number' && p.price > 0) {
    return (p.commissionPercent / 100) * p.price;
  }
  return 0;
}
function commissionPercentOf(p: ApiItem) {
  if (typeof p.commissionPercent === 'number') return p.commissionPercent;
  if (typeof p.commissionAmount === 'number' && p.price > 0) {
    return (p.commissionAmount / p.price) * 100;
  }
  return 0;
}

/* ------------------------------- ProductCard ---------------------------- */
function ProductCard({
  product,
  selected,
  onSelectAndCompose,
}: {
  product: ApiItem;
  selected?: boolean;
  onSelectAndCompose: () => void;
}) {
  const pct = typeof product.commissionPercent === 'number'
    ? product.commissionPercent
    : (product.price > 0 && typeof product.commissionAmount === 'number'
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
        <h3 className="text-sm font-semibold text-[#111827] line-clamp-2">
          {product.title}
        </h3>

        <div className="flex items-start justify-between">
          <div className="inline-flex items-center gap-1 text-[#6B7280] text-sm">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{Number(product.rating || 0).toFixed(1)}</span>
          </div>

          <div className="text-right">
            <div className="text-sm font-semibold">{formatPrice(product.price)}</div>

            {/* chips compactos: à direita, mesma linha */}
            <div className="mt-1 flex items-center justify-end gap-2">
              {typeof pct === 'number' && (
                <Badge tone="success" className="px-2 py-0.5">
                  {/* só a % */}
                  {formatPercent(pct)}
                </Badge>
              )}
              {typeof product.salesCount === 'number' && (
                <Badge className="px-2 py-0.5">
                  {/* só o número de vendas */}
                  {product.salesCount.toLocaleString('pt-BR')}
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

/* ------------------------------ Ordenação ------------------------------- */
type SortKey =
  | 'relevance'
  | 'commission'
  | 'commissionPct'
  | 'sales'
  | 'rating'
  | 'priceDesc'
  | 'priceAsc';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'relevance',     label: 'Relevância' },
  { key: 'commission',    label: 'Comissão (R$) — maior' },
  { key: 'commissionPct', label: 'Comissão (%) — maior' },
  { key: 'sales',         label: 'Vendas — maior' },
  { key: 'rating',        label: 'Avaliação — maior' },
  { key: 'priceDesc',     label: 'Preço — maior' },
  { key: 'priceAsc',      label: 'Preço — menor' },
];

// Popover via portal — nunca fica atrás dos cards
function SortMenuPortal({
  anchor,
  open,
  value,
  onChange,
  onClose,
}: {
  anchor: HTMLButtonElement | null;
  open: boolean;
  value: SortKey;
  onChange: (v: SortKey) => void;
  onClose: () => void;
}) {
  const [rect, setRect] = React.useState<DOMRect | null>(null);

  React.useEffect(() => {
    if (!open || !anchor) return;
    const update = () => setRect(anchor.getBoundingClientRect());
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, anchor]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!document.getElementById('sort-menu-portal')?.contains(target) && target !== anchor) {
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open, onClose, anchor]);

  if (!open || !rect) return null;

  const top = rect.top + rect.height + 8; // abaixo do botão
  const left = rect.right - 256; // menu alinhado à direita do botão
  const style: React.CSSProperties = {
    position: 'fixed',
    top,
    left: Math.max(8, left),
    width: 256,
    zIndex: 10_000,
  };

  const menu = (
    <div id="sort-menu-portal" style={style} className="rounded-xl border border-[#FFD9CF] bg-white shadow-lg overflow-hidden">
      <div className="p-1">
        {SORT_OPTIONS.map((o) => {
          const active = o.key === value;
          return (
            <button
              key={o.key}
              role="menuitemradio"
              aria-checked={active}
              onClick={() => { onChange(o.key); onClose(); }}
              className={[
                'w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2',
                active ? 'bg-[#EE4D2D] text-white' : 'hover:bg-[#FFF4F0] text-[#111827]',
              ].join(' ')}
            >
              <span
                className={[
                  'inline-flex items-center justify-center w-4 h-4 rounded-full border',
                  active ? 'border-white bg-white/20' : 'border-[#FFD9CF]',
                ].join(' ')}
              >
                {active && <Check className="w-3 h-3" />}
              </span>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return ReactDOM.createPortal(menu, document.body);
}

function SortControl({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-[#FFD9CF] px-3 py-2 text-sm hover:bg-[#FFF4F0]"
      >
        {SORT_OPTIONS.find((o) => o.key === value)?.label ?? 'Ordenar'}
        <ChevronDown className="w-4 h-4 opacity-70" />
      </button>
      <SortMenuPortal
        anchor={btnRef.current}
        open={open}
        value={value}
        onChange={onChange}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

/* --------------------------------- Página -------------------------------- */
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
  const [sortBy, setSortBy] = React.useState<SortKey>('relevance');

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
          it.commissionAmount ?? it.commission_amount ?? it.comissao ?? it.max_commission_amount ?? it.commission_value;
        let commissionPercent =
          it.commissionPercent ?? it.commission_percent ?? it.commission_rate ?? it.max_commission_rate;

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

  const sorted = React.useMemo(() => {
    const base = items.slice();
    switch (sortBy) {
      case 'commission':    return base.sort((a, b) => commissionAmountOf(b) - commissionAmountOf(a));
      case 'commissionPct': return base.sort((a, b) => commissionPercentOf(b) - commissionPercentOf(a));
      case 'sales':         return base.sort((a, b) => (b.salesCount ?? 0) - (a.salesCount ?? 0));
      case 'rating':        return base.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      case 'priceDesc':     return base.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      case 'priceAsc':      return base.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      default:              return base; // relevância
    }
  }, [items, sortBy]);

  return (
    <section className="space-y-4">
      <Card>
        {/* overflow visível só no container do header (para o botão), 
           popover em portal evita qualquer conflito */}
        <CardHeader
          className="relative"
          title="Filtrar/Buscar"
          subtitle="Digite o que procura e clique em Buscar para carregar os produtos."
          right={
            <div className="flex gap-2">
              <SortControl value={sortBy} onChange={setSortBy} />
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
