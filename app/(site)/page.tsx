// app/(site)/page.tsx
import Link from "next/link";
import Hero from "@/components/Hero";

export const dynamic = "force-dynamic";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* HERO separado em componente */}
      <Hero />

      <div className="mx-auto max-w-7xl px-6 space-y-24 py-16">
        {/* COMO FUNCIONA */}
        <section id="como-funciona">
          <h2 className="text-2xl md:text-3xl font-bold">Como funciona</h2>
          <p className="mt-2 text-gray-600">
            Do produto ao post final, em 3 passos.
          </p>

          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {[
              {
                t: "1) Escolha o produto",
                d: "Cole a URL do marketplace (Shopee, Amazon, Mercado Livre, AliExpress ou Temu) ou use as sugestões do painel.",
              },
              {
                t: "2) Gere legenda e link",
                d: "A IA cria uma legenda pronta para IG/FB e o sistema monta um shortlink rastreável com SubIDs.",
              },
              {
                t: "3) Publique",
                d: "Compartilhe no Instagram e Facebook direto pelo painel, ou exporte para seus fluxos.",
              },
            ].map((f, i) => (
              <div key={i} className="card">
                <div className="card-body">
                  <div className="font-semibold">{f.t}</div>
                  <p className="mt-2 text-sm text-gray-600">{f.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* RECURSOS */}
        <section id="recursos">
          <h2 className="text-2xl md:text-3xl font-bold">Recursos principais</h2>
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {[
              { t: "Legendas com IA", d: "Textos otimizados para engajamento e conversão em IG/FB." },
              { t: "SubIDs automáticos", d: "Links rastreáveis por canal/campanha para comparar performance." },
              { t: "Múltiplos marketplaces", d: "Shopee, Amazon, Mercado Livre, AliExpress e Temu." },
              { t: "Agendamento", d: "Defina data e hora para cada publicação sem complicação." },
              { t: "Estatísticas simples", d: "Acompanhe CTR e cliques por produto e por canal." },
              { t: "Workspace colaborativo", d: "Trabalhe com equipe e diferentes contas com segurança." },
            ].map((f, i) => (
              <div key={i} className="card">
                <div className="card-body">
                  <div className="font-medium">{f.t}</div>
                  <p className="mt-2 text-sm text-gray-600">{f.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* DEPOIMENTOS */}
        <section id="depoimentos" className="bg-gray-50 border rounded-2xl p-8">
          <h2 className="text-2xl md:text-3xl font-bold">Quem usa, recomenda</h2>
          <div className="mt-6 grid md:grid-cols-3 gap-6">
            {[
              { n: "Ana", d: "Economizei horas por dia. Publicar virou coisa de 2 cliques." },
              { n: "Rafael", d: "SubIDs por canal deixaram meus testes A/B claríssimos." },
              { n: "Bea", d: "Agendamento e legendas com IA bem estáveis. Adeus copiar/colar!" },
            ].map((p, i) => (
              <div key={i} className="card">
                <div className="card-body">
                  <p className="text-sm text-gray-700">“{p.d}”</p>
                  <div className="mt-3 text-xs text-gray-500">— {p.n}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="text-center">
          <h3 className="text-2xl md:text-3xl font-bold">
            Pronto para acelerar suas comissões?
          </h3>
          <p className="mt-2 text-gray-600">
            Crie sua conta, conecte seus canais e publique hoje mesmo.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/signup"
              className="btn btn-primary"
            >
              Criar conta grátis
            </Link>
            <Link
              href="/login"
              className="btn btn-ghost"
            >
              Entrar
            </Link>
          </div>
        </section>

        {/* FOOTER SIMPLES */}
        <footer className="border-t pt-10 text-sm text-gray-600">
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
              <a
                href="mailto:suporte@seureview.com.br"
                className="hover:text-gray-800"
              >
                Suporte
              </a>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            © {new Date().getFullYear()} SeuReview. Todos os direitos reservados.
          </p>
        </footer>
      </div>
    </main>
  );
}
