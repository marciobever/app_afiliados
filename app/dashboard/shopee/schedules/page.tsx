// app/dashboard/shopee/schedules/page.tsx
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireSession } from '@/lib/auth';
import SchedulesClient from './schedules-client';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { userId } = requireSession();

  const sb = supabaseAdmin().schema('Produto_Afiliado');
  const { data, error } = await sb
    .from('schedules_queue')
    .select('id, provider, platform, caption, image_url, shortlink, scheduled_at, status')
    .eq('user_id', userId)
    .order('scheduled_at', { ascending: true });

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-semibold mb-2">Agendamentos</h1>
        <p className="text-red-600">Erro ao carregar: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Agendamentos</h1>
      <SchedulesClient initialItems={data ?? []} />
    </div>
  );
}
