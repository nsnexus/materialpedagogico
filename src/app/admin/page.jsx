import { cookies } from 'next/headers';
import { ehAdmin } from '@/lib/auth';
import { AdminLogin, AdminPainel } from '@/components/Admin';

export const runtime = 'edge';
export const metadata = { title: 'Painel | Baú Pedagógico', robots: { index: false } };

export default async function PaginaAdmin() {
  return (await ehAdmin(cookies())) ? <AdminPainel /> : <AdminLogin />;
}
