import PlatformCard from '@/components/PlatformCard';
import { PLATFORMS } from '@/components/platforms';

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Escolha a plataforma</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Conecte e gerencie conteúdos de cada marketplace.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLATFORMS.map((p) => (
          <PlatformCard key={p.slug} p={p} />
        ))}
      </div>
    </div>
  );
}
