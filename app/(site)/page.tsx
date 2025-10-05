import Link from "next/link";

export const dynamic = "force-dynamic";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#EE4D2D] text-white font-bold">
              SR
            </span>
            <span className="font-semibold">SeuReview</span>
          </div>

          {/* Navegação */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#como-funciona" className="hover:text-gray-700">
              Como funciona
            </a>
            <a href="#recursos" className="hover:text-gray-700">
              Recursos
            </a>
            <a href="#depoimentos" className="hover:text-gray-700">
              Depoimentos
            </a>
            <a href="#faq" className="hover:text-gray-700">
              FAQ
            </a>
          </nav>

          {/* Ações */}
          <div className="flex items-center gap-2">
            {/* 👉 Botão de login redireciona para /login */}
            <Link
              href="/login"
              className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-[#EE4D2D] text-white px-3 py-2 text-sm hover:bg-[#D8431F]"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      {/* Hero principal */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold leading-tight">
                Descubra produtos quentes na Shopee e publique no Instagram & Facebook em minutos.
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                O SeuReview automatiza o trabalho dos afiliados: encontra produtos, gera legendas com IA, cria links rastreáveis e publica direto via Meta Graph API.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="rounded-lg bg-[#EE4D2D] text-white px-4 py-2.5 text-sm md:text-base hover:bg-[#D8431F]"
                >
                  Começar agora
                </Link>
                <a
                  href="#como-funciona"
                  className="rounded-lg border px-4 py-2.5 text-sm md:text-base hover:bg-gray-50"
                >
                  Ver como funciona
                </a>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Sem cartão de crédito • Cancele quando quiser
              </p>
            </div>

            {/* Mock de preview */}
            <div className="relative">
              <div className="rounded-2xl border shadow-sm p-4">
                <div className="h-56 md:h-72 w-full rounded-lg bg-gray-50 grid place-items-center text-gray-400 text-sm">
                  Prévia do Composer (captura/screenshot aqui)
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-500">
                  <div className="rounded-md border p-2">Gera Legenda (IA)</div>
                  <div className="rounded-md border p-2">Shortlink c/ SubIDs</div>
                  <div className="rounded-md border p-2">Publica via n8n</div>
                </div>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="mt-10 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="rounded-full border px-3 py-1">Meta (IG/FB)</span>
            <span className="rounded-full border px-3 py-1">Shopee Afiliados</span>
            <span className="rounded-full border px-3 py-1">SubIDs e Tracking</span>
            <span className="rounded-full border px-3 py-1">Agendamento</span>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="border-t bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold">Como funciona</h2>
          <p className="mt-2 text-gray-600">Do produto ao post final, em 3 passos.</p>

          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {[
              {
                t: "1. Escolha o produto",
                d: "Cole o link da Shopee ou use as sugestões automáticas do painel.",
              },
              {
                t: "2. Gere legenda e shortlink",
                d: "A IA cria uma legenda e o sistema monta um link rastreável com SubIDs.",
              },
              {
                t: "3. Publique nas redes",
                d: "Poste no Instagram ou Facebook via n8n, com um clique.",
              },
            ].map((f, i) => (
              <div key={i} className="rounded-xl bg-white border p-5">
                <div className="font-semibold">{f.t}</div>
                <p className="mt-2 text-sm text-gray-600">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section id="recursos">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold">Recursos principais</h2>
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {[
              { t: "Legendas com IA", d: "Textos otimizados para engajamento e conversão." },
              { t: "SubIDs automáticos", d: "Links rastreáveis para cada canal e campanha." },
              { t: "Integração n8n", d: "Conecte-se à Meta API e publique automaticamente." },
              { t: "Agendamento", d: "Defina data e hora para cada publicação." },
              { t: "Estatísticas", d: "Monitore desempenho e CTRs de forma simples." },
              { t: "Workspace colaborativo", d: "Gerencie múltiplas contas e afiliados." },
            ].map((f, i) => (
              <div key={i} className="rounded-xl border p-5">
                <div className="font-medium">{f.t}</div>
                <p className="mt-2 text-sm text-gray-600">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section id="depoimentos" className="bg-gray-50 border-y">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold">Quem usa, recomenda</h2>
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {[
              { n: "Ana", d: "Economizei horas por dia. Publicar virou rotina de 2 cliques." },
              { n: "Rafael", d: "Os SubIDs deixaram meus testes A/B muito mais claros." },
              { n: "Bea", d: "Agendamento e IA estáveis. Adeus cópia e cola manual!" },
            ].map((p, i) => (
              <div key={i} className="rounded-xl bg-white border p-5">
                <p className="text-sm text-gray-700">“{p.d}”</p>
                <div className="mt-3 text-xs text-gray-500">— {p.n}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-gray-600">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#EE4D2D] text-white text-xs font-bold">
                SR
              </span>
              <span>SeuReview</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="hover:text-gray-800">
                Termos
              </Link>
              <Link href="/privacy" className="hover:text-gray-800">
                Privacidade
              </Link>
              <a href="mailto:suporte@seureview.com.br" className="hover:text-gray-800">
                Suporte
              </a>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            © {new Date().getFullYear()} SeuReview. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </main>
  );
}
