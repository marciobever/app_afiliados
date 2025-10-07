'use client';

import React from 'react';
import { Filter } from 'lucide-react';
import ComposerDrawer from './ComposerDrawer';

type ApiItem = {
  id: string;
  title: string;
  price: number;
  rating: number;
  image: string;
  url: string;
};

function TerminalCard({
  product,
  selected,
  onSelectAndCompose,
}: {
  product: ApiItem;
  selected?: boolean;
  onSelectAndCompose: () => void;
}) {
  return (
    <aside
      className={[
        'bg-black text-white p-4 rounded-xl w-full font-mono shadow-sm border',
        'transition-all duration-200',
        selected ? 'ring-2 ring-[#EE4D2D] border-[#2a2a2a]' : 'border-[#2a2a2a]',
      ].join(' ')}
      style={{ boxShadow: '0 2px 0 rgba(0,0,0,0.05)' }}
    >
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <p className="text-sm text-gray-400">shopee-cli</p>
      </div>

      <button
        onClick={onSelectAndCompose}
        className="mt-4 w-full text-left space-y-3 focus:outline-none"
        aria-label="Abrir composer"
      >
        <div className="aspect-[4/3] bg-[#0f0f0f] rounded-lg overflow-hidden border border-[#1f1f1f]">
          <img src={product.image} alt={product.title} className="w-full h-full object-cover" loading="lazy" />
        </div>

        <div className="space-y-1">
          <p className="text-[#FF6A3C]">$ {product.title}</p>
          <p className="text-gray-300">
            <span className="text-amber-300">★</span> {product.rating.toFixed(1)} — R${' '}
            {Number(product.price ?? 0).toFixed(2)}
          </p>
          <p className="text-gray-500 text-xs"># {product.id}</p>
        </div>
      </button>

      <div className="flex gap-2 pt-1">
        <button
          className={[
            'px-3 py-1.5 rounded text-sm border transition-colors w-full',
            selected
              ? 'bg-[#EE4D2D] hover:bg-[#D8431F] text-white border-[#EE4D2D]'
              : 'bg-[#10B981] hover:bg-[#0EA371] text-white border-[#0EA371]',
          ].join(' ')}
          onClick={onSelectAndCompose}
        >
          {selected ? 'Selecionado • Editar' : 'Selecionar'}
        </button>
      </div>
    </aside>
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
          query: query?.trim() || 'liquidificador',
          filters: { limit: 24 }, // ✅ só limite
          sort: 'relevance',
          country: 'BR',
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const list: ApiItem[] = Array.isArray(data?.items) ? data.items : [];
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

  const filtered = React.useMemo(() => {
    let out = items.slice();
    const q = query.trim().toLowerCase();
    if (q) out = out.filter((p) => p.title.toLowerCase().includes(q));
    return out;
  }, [items, query]);

  return (
    <section className="space-y-4">
      {/* Filtro */}
      <div className="rounded-xl border border-dashed border-[#FFD9CF] bg-white">
        <div className="p-4 border-b border-[#FFD9CF] flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-2 text-[#111827]">
            <Filter className="w-5 h-5 text-[#EE4D2D]" /> Filtrar/Buscar
          </h2>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 rounded-lg bg-[#EE4D2D] hover:bg-[#D8431F] text-white text-sm"
              onClick={runSearch}
              disabled={loading}
            >
              {loading ? 'Buscando…' : 'Buscar'}
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); runSearch(); }}
          className="p-4 grid gap-3 md:grid-cols-[1fr_auto]"
        >
          <input
            className="border border-[#FFD9CF] rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D]"
            placeholder="Buscar por título…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-sm transition-colors bg-[#EE4D2D] hover:bg-[#D8431F] text-white"
            disabled={loading}
          >
            {loading ? 'Buscando…' : 'Buscar'}
          </button>
        </form>
      </div>

      {/* Estado de erro */}
      {err && (
        <div className="p-3 rounded-lg border border-[#FFD9CF] bg-[#FFF4F0] text-[#B42318] text-sm">
          {err}
        </div>
      )}

      {/* Mensagem inicial sem busca */}
      {!loading && !err && items.length === 0 && (
        <div className="p-4 rounded-lg border border-[#FFD9CF] bg-white text-sm text-[#6B7280]">
          Faça uma busca para listar produtos.
        </div>
      )}

      {/* Grid */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((p) => (
          <div key={p.id}>
            <TerminalCard
              product={p}
              selected={selected.includes(p.id)}
              onSelectAndCompose={() => selectAndOpen(p)}
            />
          </div>
        ))}
      </div>

      {/* Drawer de composição */}
      <ComposerDrawer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        product={composerProduct}
      />
    </section>
  );
}
