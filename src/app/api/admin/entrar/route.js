import { NextResponse } from 'next/server';
import { conferirLoginAdmin, conferirSenhaAdmin, gravarSessaoAdmin } from '@/lib/auth';
import { podeTentarLogin } from '@/lib/contas';

export const runtime = 'edge';

export async function POST(req) {
  const { email, senha } = await req.json().catch(() => ({}));
  if (!(await podeTentarLogin('__admin__'))) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde 15 minutos.' }, { status: 429 });
  }
  const valido = email
    ? await conferirLoginAdmin(email, String(senha || ''))
    : await conferirSenhaAdmin(String(senha || ''));

  if (!valido) {
    return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  await gravarSessaoAdmin(res);
  return res;
}
