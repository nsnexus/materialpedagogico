import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { contaDaSessao } from '@/lib/auth';
import Portal from '@/components/Portal';

export const runtime = 'edge';
export const metadata = { title: 'Meu portal | Baú Pedagógico', robots: { index: false } };

export default async function PaginaPortal() {
  const conta = await contaDaSessao(cookies());
  if (!conta) redirect('/entrar');
  return <Portal nome={conta.nome.split(' ')[0]} />;
}
