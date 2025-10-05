// app/(site)/page.tsx
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function LandingPage() {
  return (
    <div className="space-y-24">
      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(238,77,45,0.08),rgba(255,255,255,0))]" />
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-medium text-[#EE4D2D] bg-[#FFF1ED] border border-[#FFD9CF] rounded-full px-2.5 py-1">
              Novo • Publicação via Meta Graph
            </p>
            <h1 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1]">
              Descubra produtos quentes na Shopee e publique no Instagram & Facebook.
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-[56ch]">
              O SeuReview automatiza o trabalho dos afiliados: encontra produtos, gera legendas com IA,
              cria links rastreáveis e publica direto via n8n (Meta Graph API).
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard/shopee" className="btn btn-primary">Começar agora</Link>
              <a href="#como-funciona" className="btn btn-ghost">Ver como funciona</a>
            </div>
            <p className="mt-3 text-xs text-gray-500">Sem cartão de crédito • Cancele quando quiser</p>
          </div>

          {/* Mock do Composer */}
          <div className="card overflow-hidden">
            <div className="card-body">
              <div className="h-64 w-full rounded-lg bg-gray-50 grid place-items-center text-gray-400 text-sm">
                Prévia do Composer (screenshot futuro)
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="chip">Gera Legenda (IA)</div>
                <div className="chip">Shortlink c/ SubIDs</div>
                <div className="chip">Publica via n8n</div>
              </div>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-10 flex flex-wrap items-center gap-3 text-xs text-gray-600">
          <span className="badge">Meta (IG/FB)</span>
          <span className="badge">Shopee Afiliados</span>
          <span className="badge">SubIDs & Tracking</span>
          <span className="badge">Agendamento</span>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona">
        <h2 className="text-2xl md:text-3xl font-bold">Como funciona</h2>
        <p className="mt-2 text-gray-600">Do produto ao post final, em 3 passos.</p>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {[
            { t: "1) Escolha o produto", d: "Cole a URL da Shopee ou use as sugestões do painel." },
            { t: "2) Gere legenda e shortlink", d: "IA cria a legenda e nós montamos SubIDs por canal." },
            { t: "3) Publique", d: "Envie agora ou agende no Instagram/Facebook via n8n." },
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
            { t: "Legendas com IA", d: "Textos otimizados para engajamento e conversão." },
            { t: "SubIDs automáticos", d: "Links rastreáveis por canal e campanha." },
            { t: "Integração n8n", d: "Conecte-se à Meta API e publique automaticamente." },
            { t: "Agendamento", d: "Defina data e hora para cada publicação." },
            { t: "Estatísticas", d: "Monitore desempenho e CTRs de forma simples." },
            { t: "Workspace", d: "Gerencie múltiplas contas e afiliados." },
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
            { n: "Ana", d: "Economizei horas por dia. Publicar virou 2 cliques." },
            { n: "Rafael", d: "SubIDs por canal deixaram os testes A/B claríssimos." },
            { n: "Bea", d: "Agendamento + IG Graph estáveis. Adeus copiar/colar." },
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
    </div>
  );
}
