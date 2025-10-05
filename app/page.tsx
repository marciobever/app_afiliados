// server component por padrão
import { redirect } from 'next/navigation';

export default function Index() {
  redirect('/'); // se o seu landing estiver em /(site)/page.tsx e for a rota raiz,
                 // use redirect('/home') se você colocar em /home
}
