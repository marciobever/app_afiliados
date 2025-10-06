'use client';

import Link from "next/link";
import Hero from "@/components/Hero";
import ComoFunciona from "@/components/ComoFunciona";
import Newsletter from "@/components/Newsletter";
import { motion } from "framer-motion";

export const dynamic = "force-dynamic";

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      {/* HERO */}
      <Hero />

      <div className="mx-auto max-w-7xl px-6 space-y-32 py-16">
        {/* COMO FUNCIONA */}
        <ComoFunciona />

        {/* RECURSOS */}
        <section id="recursos">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center">
              Recursos que <span className="text-gradient">potencializam</span> suas vendas
            </h2>
            <p className="mt-3 text-gray-600 text-center max-w-2xl mx-auto">
              Tudo o que você precisa para transformar produtos em conteúdo que converte — em minutos.
            </p>

            <div className="mt-12 grid md:grid-cols-3 gap-6">
              {[
                {
                  t: "Legendas com IA",
                  d: "Textos criados sob medida para engajamento e conversão em Instagram, Facebook e Reels.",
                },
                {
                  t: "UTM + SubIDs",
                  d: "Acompanhe cliques e performance por campanha, canal e variação.",
                },
                {
                  t: "Multi-marketplaces",
                  d: "Shopee, Amazon, Mercado Livre, AliExpress, Temu e muito mais.",
                },
                {
                  t: "Agendamento inteligente",
                  d: "Programe publicações para horários de pico com poucos cliques.",
                },
                {
                  t: "Estatísticas em tempo real",
                  d: "CTR, engajamento e receita estimada — tudo em um só lugar.",
                },
                {
                  t: "Workspace colaborativo",
                  d: "Trabalhe com equipe e múltiplas contas com segurança e controle.",
                },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  className="card group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  viewport={{ once: true }}
                >
                  <div className="card-body">
                    <div className="font-semibold text-lg text-gray-900 group-hover:text-[#EE4D2D] transition">
                      {f.t}
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{f.d}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* DEPOIMENTOS */}
        <section id="depoimentos" className="bg-gray-50 border rounded-2xl p-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center">
              Quem usa, <span className="text-gradient">recomenda</span>
            </h2>
            <div className="mt-8 grid md:grid-cols-3 gap-6">
              {[
                {
                  n: "Ana Souza",
                  d: "Economizei horas por dia. Agora tudo sai automático, pronto pra postar.",
                },
                {
                  n: "Rafael Costa",
                  d: "Os SubIDs me ajudaram a entender o que realmente dá retorno em cada canal.",
                },
                {
                  n: "Beatriz Lima",
                  d: "As legendas com IA são ótimas! Publicar virou algo rápido e divertido.",
                },
              ].map((p, i) => (
                <motion.div
                  key={i}
                  className="card bg-white"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="card-body">
                    <p className="text-sm text-gray-700 leading-relaxed">“{p.d}”</p>
                    <div className="mt-3 text-xs text-gray-500">— {p.n}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* CTA + NEWSLETTER */}
        <section>
          <motion.div
            className="text-center space-y-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl md:text-4xl font-extrabold">
              Pronto para <span className="text-gradient">acelerar</span> suas comissões?
            </h3>
            <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
              Cadastre-se e comece a publicar produtos prontos com links rastreáveis e legendas otimizadas.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <Link href="/signup" className="btn btn-primary text-base">
                Criar conta grátis
              </Link>
              <Link href="/login" className="btn btn-ghost text-base">
                Entrar
              </Link>
            </div>

            {/* Newsletter */}
            <div className="mt-12">
              <Newsletter />
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
