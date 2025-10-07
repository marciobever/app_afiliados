'use client';

import Link from 'next/link';

const COLOR = '#FF5B00';

export default function TemuPage() {
  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: COLOR }}>
          Temu — Painel
        </h1>
        <Link href="/dashboard" className="text-sm underline">Voltar</Link>
      </div>

      <div className="rounded-xl border p-6">
        <p className="text-sm text-[#6B7280]">Em breve.</p>
      </div>
    </main>
  );
}
