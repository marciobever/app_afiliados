import PlatformCard from "@/components/PlatformCard";

export default function DashboardHub() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="pt-2">
        <h1 className="text-2xl font-bold text-gray-900">Escolha a plataforma</h1>
        <p className="mt-1 text-sm text-gray-600">
          Conecte e gerencie conteúdos de cada marketplace/rede.
        </p>
      </header>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Shopee */}
        <PlatformCard
          initials="S"
          name="Shopee"
          desc="Buscar produtos e publicar com legendas automáticas."
          href="/dashboard/shopee"
          colorFrom="from-[#EE4D2D]"
          colorTo="to-[#FF8A65]"
          badge="disponível"
        />

        {/* Amazon (em breve) */}
        <PlatformCard
          initials="A"
          name="Amazon"
          desc="Integração de buscas e publicações."
          disabled
          colorFrom="from-[#FF9900]"
          colorTo="to-[#232F3E]"
          badge="em breve"
        />

        {/* Mercado Livre (em breve) */}
        <PlatformCard
          initials="ML"
          name="Mercado Livre"
          desc="Integração de buscas e publicações."
          disabled
          colorFrom="from-[#FFE600]"
          colorTo="to-[#00A650]"
          badge="em breve"
        />

        {/* Temu (em breve) */}
        <PlatformCard
          initials="T"
          name="Temu"
          desc="Integração de buscas e publicações."
          disabled
          colorFrom="from-[#FF5622]"
          colorTo="to-[#FF8C66]"
          badge="em breve"
        />
      </section>
    </div>
  );
}
