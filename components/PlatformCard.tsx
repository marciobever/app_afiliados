'use client';

import Link from 'next/link';
import { PLATFORMS, Platform } from './platforms';

export default function PlatformCard({ p }: { p: Platform }) {
  return (
    <Link
      href={`/dashboard/${p.slug}`}
      className="group relative rounded-2xl border border-[#FFD9CF] p-4 hover:shadow-sm transition"
    >
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-xl grid place-items-center text-white font-bold"
          style={{ backgroundColor: p.color }}
        >
          {p.badgeText}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-[#111827]">{p.name}</div>
          <p className="text-sm text-[#6B7280] truncate">{p.description}</p>
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1 rounded-b-2xl"
        style={{ backgroundColor: p.color }}
      />
    </Link>
  );
}
