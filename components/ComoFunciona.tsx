// components/ComoFunciona.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, ease: 'easeOut', delay },
});

const steps = [
  {
    title: '1) Escolha o produto',
    desc: 'Cole a URL do marketplace (Shopee, Amazon, Mercado Livre, AliExpress ou Temu) ou use as sugestões do painel.',
  },
  {
    title: '2) Gere legenda e link',
    desc: 'A IA cria uma legenda pronta e o sistema gera um shortlink com UTM e SubIDs para rastrear por canal.',
  },
  {
    title: '3) Publique',
    desc: 'Compartilhe no Instagram e Facebook direto pelo painel, ou exporte para seus fluxos.',
  },
];

export default function ComoFunciona() {
  return (
    <section id="como-funciona" className="section">
      <div className="max-container">
        {/* Título */}
        <div className="text-center">
          <motion.div {...fadeUp(0)}>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#FFD9CF] bg-[#FFF4F0] px-3 py-1 text-xs font-medium text-[#D8431F]">
              Passo a passo sem fricção
            </span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold">
              Como <span className="text-gradient">funciona</span>
            </h2>
            <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
              Do produto ao post final, em 3 passos.
            </p>
          </motion.div>
        </div>

        {/* Cards */}
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="card">
              <motion.div {...fadeUp(0.05 * i)}>
                <div className="card-body">
                  <div className="font-semibold text-lg">{s.title}</div>
                  <p className="mt-2 text-sm text-gray-600">{s.desc}</p>
                </div>
              </motion.div>
            </div>
          ))}
        </div>

        {/* CTA secundária */}
        <div className="mt-10 text-center">
          <motion.div {...fadeUp(0.15)}>
            <Link href="/signup" className="btn btn-primary">
              Criar conta grátis
            </Link>
            <span className="mx-3 text-gray-400 text-sm">ou</span>
            <Link href="/login" className="btn btn-ghost">
              Entrar
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
