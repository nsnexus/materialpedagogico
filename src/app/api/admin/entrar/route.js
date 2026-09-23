import { NextResponse } from 'next/server';
import { conferirSenhaAdmin, gravarSessaoAdmin } from '@/lib/auth';
import { podeTentarLogin } from '@/lib/contas';

export const runtime = 'edge';

export async function POST(req) {
  const { senha } = await req.json().catch(() => ({}));
  if (!(await podeTentarLogin('__admin__'))) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde 15 minutos.' }, { status: 429 });
  }
  if (!(await conferirSenhaAdmin(String(senha || '')))) {
    return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  await gravarSessaoAdmin(res);
  return res;
}
