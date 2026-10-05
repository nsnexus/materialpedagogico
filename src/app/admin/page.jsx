import { cookies } from 'next/headers';
import { ehAdmin } from '@/lib/auth';
import { AdminLogin, AdminPainel } from '@/components/Admin';
import { SITE } from '@/lib/site';

export const runtime = 'edge';
export const metadata = { title: `Painel | ${SITE.marca}`, robots: { index: false } };

export default async function PaginaAdmin() {
  return (await ehAdmin(cookies())) ? <AdminPainel /> : <AdminLogin />;
}
