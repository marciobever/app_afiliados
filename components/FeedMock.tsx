"use client";

import * as React from "react";
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send } from "lucide-react";

type StyleName = "Minimal" | "Promo" | "Dark" | "Vibrante" | "Clean";

type Product = {
  id: string;
  title: string;
  image: string;
  price?: number | null;
};

type Props = {
  username?: string;
  avatarUrl?: string;
  verified?: boolean;
  location?: string;
  products: Product[];
  caption: string;
  likes?: number;
  timeAgo?: string;
  style?: StyleName;
  showPriceBadge?: boolean;
};

const STYLE = {
  Minimal:  { price: "bg-[#10B981] text-white", dot: "bg-[#111827]" },
  Promo:    { price: "bg-[#EE4D2D] text-white", dot: "bg-[#EE4D2D]" },
  Dark:     { price: "bg-[#22C55E] text-black/90", dot: "bg-white" },
  Vibrante: { price: "bg-[#14B8A6] text-white", dot: "bg-[#FF6A3C]" },
  Clean:    { price: "bg-[#111827] text-white", dot: "bg-[#111827]" },
} as const;

function currency(v?: number | null) {
  if (typeof v !== "number") return null;
  try {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  } catch {
    return `R$ ${v.toFixed(2)}`;
  }
}

export default function FeedMock({
  username = "seudominio",
  avatarUrl = "https://i.pravatar.cc/120?img=13",
  verified = false,
  location,
  products,
  caption,
  likes = 128,
  timeAgo = "há 2 h",
  style = "Minimal",
  showPriceBadge = true,
}: Props) {
  const theme = STYLE[style] || STYLE.Minimal;
  const pics = React.useMemo(() => {
    return (products || [])
      .filter(p => p?.image)
      .slice(0, 4)
      .map(p => ({ src: p.image, price: currency(p.price), title: p.title }));
  }, [products]);
  const hasCarousel = pics.length > 1;

  return (
    <article className="w-full max-w-[420px] rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-3">
          <img
            src={avatarUrl}
            alt={username}
            loading="lazy"
            className="h-8 w-8 rounded-full object-cover"
          />
          <div className="leading-tight">
            <div className="flex items-center gap-1 text-sm font-semibold">
              <span>@{username}</span>
              {verified && (
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-blue-500">
                  <path
                    fill="currentColor"
                    d="M12 2l2.39 4.85L20 8l-4 3.9L17 18l-5-2.6L7 18l1-6.1L4 8l5.61-1.15L12 2z"
                  />
                </svg>
              )}
            </div>
            {location && <div className="text-xs text-neutral-500">{location}</div>}
          </div>
        </div>
        <MoreHorizontal className="h-5 w-5 text-neutral-600" />
      </header>

      {/* Imagem */}
      <div className="relative bg-neutral-100">
        <div className="relative w-full" style={{ paddingBottom: "100%" }}>
          {pics.length === 0 && (
            <div className="absolute inset-0 grid place-items-center text-neutral-400 text-sm">
              (sem imagem)
            </div>
          )}
          {pics.length === 1 && (
            <img
              src={pics[0].src}
              alt="post"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {pics.length === 2 && (
            <div className="absolute inset-0 grid grid-cols-2 gap-0.5 bg-white">
              {pics.map((p, i) => (
                <img key={i} src={p.src} alt="" loading="lazy" className="w-full h-full object-cover" />
              ))}
            </div>
          )}
          {pics.length === 3 && (
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5 bg-white">
              <img src={pics[0].src} alt="" loading="lazy" className="col-span-2 row-span-1 w-full h-full object-cover" />
              <img src={pics[1].src} alt="" loading="lazy" className="w-full h-full object-cover" />
              <img src={pics[2].src} alt="" loading="lazy" className="w-full h-full object-cover" />
            </div>
          )}
          {pics.length === 4 && (
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5 bg-white">
              {pics.map((p, i) => (
                <img key={i} src={p.src} alt="" loading="lazy" className="w-full h-full object-cover" />
              ))}
            </div>
          )}

          {/* Preço */}
          {showPriceBadge && pics.some(p => p.price) && (
            <div className="absolute left-2 bottom-2">
              <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${theme.price}`}>
                {pics.find(p => p.price)?.price}
              </span>
            </div>
          )}

          {/* Dots */}
          {hasCarousel && (
            <div className="absolute bottom-2 right-2 flex gap-1.5">
              {pics.map((_, i) => (
                <span key={i} className={`h-1.5 w-1.5 rounded-full opacity-80 ${theme.dot}`} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Heart className="h-6 w-6" />
            <MessageCircle className="h-6 w-6" />
            <Send className="h-6 w-6" />
          </div>
          <Bookmark className="h-6 w-6" />
        </div>
        <div className="mt-2 text-sm font-semibold">{likes.toLocaleString("pt-BR")} curtidas</div>
      </div>

      {/* Legenda */}
      <div className="px-3 pb-3">
        <Caption username={username} text={caption} />
        <button className="mt-1 text-sm text-neutral-500">Ver todos os 12 comentários</button>
        <div className="mt-1 text-[11px] uppercase tracking-wide text-neutral-400">{timeAgo}</div>
      </div>
    </article>
  );
}

function Caption({ username, text }: { username: string; text: string }) {
  const parts = (text || "").split(/(\s#[\p{L}\p{N}_]+)|\n/gu).filter(Boolean);
  return (
    <p className="text-sm leading-snug whitespace-pre-wrap">
      <span className="font-semibold">@{username} </span>
      {parts.map((chunk, i) =>
        chunk?.startsWith("#") ? (
          <span key={i} className="text-neutral-600">{chunk}</span>
        ) : chunk === "\n" ? (
          "\n"
        ) : (
          <span key={i}>{chunk}</span>
        )
      )}
    </p>
  );
}