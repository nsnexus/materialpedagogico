import { NextResponse } from 'next/server';
import { getConta, normalizarEmail, podeTentarLogin } from '@/lib/contas';
import { conferirSenha, gravarSessao } from '@/lib/auth';

export const runtime = 'edge';

export async function POST(req) {
  let body = {};
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }
  const email = normalizarEmail(body.email);
  const senha = String(body.senha || '');

  try {
    if (!(await podeTentarLogin(email))) {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde 15 minutos.' }, { status: 429 });
    }
    const conta = await getConta(email);
    if (!conta || !(await conferirSenha(senha, conta))) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 });
    }
    if (conta.status === 'bloqueada') {
      return NextResponse.json({ error: 'Acesso bloqueado. Fale com o suporte.' }, { status: 403 });
    }
    if (conta.status !== 'ativa') {
      return NextResponse.json({ error: 'Acesso ainda não liberado.' }, { status: 403 });
    }
    const res = NextResponse.json({ ok: true });
    await gravarSessao(res, conta);
    return res;
  } catch (err) {
    console.error('[POST /api/entrar]', err.message);
    return NextResponse.json({ error: 'Não foi possível entrar agora.' }, { status: 500 });
  }
}
