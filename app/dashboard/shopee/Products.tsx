'use client';

import React from 'react';
import ComposerDrawer from './ComposerDrawer';
import { Card, CardHeader, CardBody, Button, Input } from '@/components/ui';
import { Star, Percent, TrendingUp, ChevronDown, Check } from 'lucide-react';

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

/* --------------------------------- utils --------------------------------- */
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

/* micro chip (bem discreto) */
function Micro({
  children,
}: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#FFD9CF] bg-[#FFF9F7] px-2 py-0.5 text-[11px] text-[#374151]">
      {children}
    </span>
  );
}

/* ---------------------------- Card do produto ---------------------------- */
function ProductCard({
  product,
  selected,
  onSelectAndCompose,
}: {
  product: ApiItem;
  selected?: boolean;
  onSelectAndCompose: () => void;
}) {
  // texto compacto da comissão (prioriza %; se não tiver, mostra R$; se tiver ambos, mostra “% • R$”)
  const hasPct = typeof product.commissionPercent === 'number';
  const hasAmt = typeof product.commissionAmount === 'number';
  const pctText = hasPct ? formatPercent(product.commissionPercent) : null;
  const amtText = hasAmt ? formatPrice(product.commissionAmount) : null;
  const commissionCompact = hasPct ? (amtText ? `${pctText} • ${amtText}` : pctText) : amtText;

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
        <h3 className="text-sm font-semibold text-[#111827] line-clamp-2">{product.title}</h3>

        {/* linha: rating à esquerda / preço à direita com metadados abaixo */}
        <div className="flex items-start justify-between">
          <div className="inline-flex items-center gap-1 text-[#6B7280] text-sm">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{Number(product.rating || 0).toFixed(1)}</span>
          </div>

          <div className="text-right">
            <div className="text-sm font-semibold">{formatPrice(product.price)}</div>
            <div className="mt-1 flex items-center justify-end gap-2">
              {commissionCompact && (
                <Micro>
                  <Percent className="w-3 h-3" />
                  {commissionCompact}
                </Micro>
              )}
              {typeof product.salesCount === 'number' && (
                <Micro>
                  <TrendingUp className="w-3 h-3" />
                  {product.salesCount.toLocaleString('pt-BR')} vendas
                </Micro>
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

/* ---------------------------- Ordenar (Popover) ---------------------------- */
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

function useOutsideClose(ref: React.RefObject<HTMLElement>, onClose: () => void) {
  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (ref.current.contains(e.target as Node)) return;
      onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, onClose]);
}

function SortControl({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  useOutsideClose(ref, () => setOpen(false));

  const current = SORT_OPTIONS.find((o) => o.key === value)?.label ?? 'Ordenar';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-[#FFD9CF] px-3 py-2 text-sm hover:bg-[#FFF4F0]"
      >
        {current}
        <ChevronDown className="w-4 h-4 opacity-70" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-xl border border-[#FFD9CF] bg-white shadow-lg overflow-hidden z-[999]"
        >
          <div className="p-1">
            {SORT_OPTIONS.map((o) => {
              const active = o.key === value;
              return (
                <button
                  key={o.key}
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    onChange(o.key);
                    setOpen(false);
                  }}
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
      )}
    </div>
  );
}

/* --------------------------------- Page --------------------------------- */
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
        <CardHeader
          className="relative overflow-visible"
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
