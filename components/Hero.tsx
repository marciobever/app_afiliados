'use client'

import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-100">
      {/* Brilho decorativo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,77,0,0.15),transparent_60%)]"></div>

      <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Texto principal */}
          <div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-gray-900">
              Encontre produtos virais e ganhe comissões em{' '}
              <span className="bg-gradient-to-r from-[#EE4D2D] via-[#FF7A45] to-[#EE4D2D] bg-clip-text text-transparent animate-pulse">
                minutos.
              </span>
            </h1>

            <p className="mt-5 text-lg text-gray-600 max-w-lg">
              O <strong>SeuReview</strong> conecta você às melhores ofertas da{' '}
              Shopee, Amazon, Mercado Livre, AliExpress e Temu — com legendas
              inteligentes, links rastreáveis e um painel simples para publicar
              tudo com estilo.
            </p>

            {/* Botões */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-xl bg-[#EE4D2D] text-white px-6 py-3 text-sm md:text-base font-medium shadow hover:bg-[#d93e1c] hover:shadow-md transition-all"
              >
                Começar agora
              </Link>
              <a
                href="#como-funciona"
                className="rounded-xl border border-gray-300 px-6 py-3 text-sm md:text-base font-medium text-gray-700 hover:bg-gray-100 transition-all"
              >
                Ver como funciona
              </a>
            </div>
          </div>

          {/* Visual / mockup */}
          <div className="relative">
            <div className="rounded-3xl border shadow-lg p-4 bg-white/80 backdrop-blur-sm">
              <div className="h-64 md:h-80 w-full rounded-2xl bg-gradient-to-tr from-orange-100 to-white grid place-items-center text-gray-400 text-sm font-medium">
                <span className="text-gray-500">💡 Prévia do painel de afiliados</span>
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-gray-600">
                <span className="rounded-full border px-3 py-1 bg-orange-50">Shopee</span>
                <span className="rounded-full border px-3 py-1 bg-yellow-50">Amazon</span>
                <span className="rounded-full border px-3 py-1 bg-blue-50">Mercado Livre</span>
                <span className="rounded-full border px-3 py-1 bg-red-50">AliExpress</span>
                <span className="rounded-full border px-3 py-1 bg-pink-50">Temu</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
