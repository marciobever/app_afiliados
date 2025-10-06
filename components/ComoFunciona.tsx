'use client'

import { motion } from 'framer-motion'
import { Search, Sparkles, Link as LinkIcon, Megaphone } from 'lucide-react'
import Link from 'next/link'

const steps = [
  {
    icon: Search,
    title: '1. Descubra',
    desc:
      'Busque ofertas e tendências em Shopee, Amazon, Mercado Livre, AliExpress e Temu. Cole uma URL ou escolha sugestões do painel.',
    chip: 'Multi-marketplace',
  },
  {
    icon: Sparkles,
    title: '2. Crie com IA',
    desc:
      'Geramos legenda pronta para IG/FB + variações, imagem destacada e hashtags — tudo com foco em cliques e conversão.',
    chip: 'Legendas otimizadas',
  },
  {
    icon: LinkIcon,
    title: '3. Rastreie',
    desc:
      'Seu link recebe SubIDs e UTMs automaticamente. Compare canais, campanhas e formatos sem dor de cabeça.',
    chip: 'SubIDs + UTM',
  },
  {
    icon: Megaphone,
    title: '4. Publique',
    desc:
      'Compartilhe ou agende posts direto do painel e acompanhe o desempenho. Zero copiar/colar.',
    chip: 'Agendamento simples',
  },
]

// animações
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px 0px -80px' },
  transition: { duration: 0.6, ease: 'easeOut', delay },
})

export default function ComoFunciona() {
  return (
    <section
      id="como-funciona"
      className="relative section"
    >
      {/* fundo decorativo com glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[520px] w-[720px] -translate-x-1/2 blur-3xl"
             style={{ background:
               'radial-gradient(60% 60% at 50% 20%, rgba(238,77,45,0.18) 0%, rgba(238,77,45,0.08) 35%, rgba(255,255,255,0) 70%)' }} />
      </div>

      <div className="max-container">
        {/* título */}
        <motion.div className="text-center" {...fadeUp(0)}>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#FFD9CF] bg-[#FFF4F0] px-3 py-1 text-xs font-medium text-[#D8431F]">
            Passo a passo sem fricção
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight">
            Como <span className="text-gradient">funciona</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            Do produto ao post final em poucos cliques — com rastreio por canal e conteúdo pronto.
          </p>
        </motion.div>

        {/* grid de passos */}
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              className="group relative rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-lg"
              {...fadeUp(0.1 + i * 0.08)}
            >
              {/* borda glow ao hover */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition group-hover:opacity-100"
                   style={{ boxShadow: '0 0 0 1px rgba(238,77,45,0.25), 0 10px 30px rgba(238,77,45,0.15) inset' }} />
              <div className="relative">
                <div className="mb-4 inline-grid h-12 w-12 place-items-center rounded-xl bg-[#EE4D2D]/10 text-[#EE4D2D]">
                  <s.icon size={24} strokeWidth={2.2} />
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] text-gray-600">
                  {s.chip}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* faixa demonstrativa / “timeline” compacta */}
        <motion.div
          className="mt-12 overflow-hidden rounded-2xl border bg-white/80 backdrop-blur-sm"
          {...fadeUp(0.2)}
        >
          <div className="grid items-stretch gap-0 md:grid-cols-2">
            <div className="p-6">
              <h4 className="text-base font-semibold">Em prática</h4>
              <p className="mt-2 text-sm text-gray-600">
                Você escolhe um produto, nós montamos o conteúdo e o link rastreável.
                Depois, é só publicar — agora ou agendado.
              </p>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-[#EE4D2D]/15 ring-1 ring-[#EE4D2D]/30" />
                  <div>
                    <div className="font-medium text-gray-900">Legenda pronta</div>
                    <div className="text-gray-600">Hook, bullets, CTA e hashtags ajustados ao nicho</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-[#EE4D2D]/15 ring-1 ring-[#EE4D2D]/30" />
                  <div>
                    <div className="font-medium text-gray-900">Link com SubIDs</div>
                    <div className="text-gray-600">UTM + SubIDs por plataforma para comparar resultados</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-[#EE4D2D]/15 ring-1 ring-[#EE4D2D]/30" />
                  <div>
                    <div className="font-medium text-gray-900">Publicação fácil</div>
                    <div className="text-gray-600">Compartilhe em IG/FB ou exporte para outros fluxos</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/signup" className="btn btn-primary">Criar conta grátis</Link>
                <Link href="/login" className="btn btn-ghost">Entrar</Link>
              </div>
            </div>

            {/* “mock” do cartão com brilho */}
            <div className="relative">
              <div className="pointer-events-none absolute -inset-x-8 inset-y-8 -z-10 blur-2xl"
                   style={{ background:
                     'radial-gradient(50% 50% at 60% 50%, rgba(238,77,45,0.20), rgba(255,255,255,0))' }} />
              <div className="h-full w-full bg-[linear-gradient(135deg,rgba(255,255,255,0.9)_0%,rgba(255,244,240,0.9)_100%)] p-6">
                <div className="h-full rounded-xl border bg-white/70 p-4 shadow-sm">
                  <div className="h-40 rounded-lg bg-gray-50 grid place-items-center text-gray-400 text-sm">
                    Prévia do post (imagem)
                  </div>
                  <div className="mt-3 space-y-2 text-xs text-gray-600">
                    <div className="rounded-md border bg-white p-2">
                      “Legenda otimizada com CTA e hashtags…”
                    </div>
                    <div className="rounded-md border bg-white p-2">
                      https://s.seureview.com/abcd?subid=instagram
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="btn btn-primary">Publicar</button>
                    <button className="btn btn-ghost">Agendar</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA final */}
        <motion.div className="mt-14 text-center" {...fadeUp(0.1)}>
          <h3 className="text-2xl md:text-3xl font-extrabold">
            Pronto para transformar cliques em comissões?
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-gray-600">
            Experimente agora e publique seu primeiro post com conteúdo e rastreio prontos.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/signup" className="btn btn-primary">Começar agora</Link>
            <Link href="/login" className="btn btn-ghost">Entrar</Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
