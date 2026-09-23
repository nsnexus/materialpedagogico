import { NextResponse } from 'next/server';
import { atualizarConta, consumirTokenReset, getConta } from '@/lib/contas';
import { gravarSessao, hashSenha } from '@/lib/auth';

export const runtime = 'edge';

export async function POST(req) {
  const { token, senha } = await req.json().catch(() => ({}));
  const nova = String(senha || '');
  if (nova.length < 6 || nova.length > 128) {
    return NextResponse.json({ error: 'A senha precisa ter pelo menos 6 caracteres.' }, { status: 400 });
  }

  const email = await consumirTokenReset(token);
  const conta = email ? await getConta(email) : null;
  if (!conta || conta.status !== 'ativa') {
    return NextResponse.json(
      { error: 'Este link expirou ou já foi usado. Peça um novo em "Esqueci a senha".' },
      { status: 400 }
    );
  }

  const { hash, salt } = await hashSenha(nova);
  const atualizada = await atualizarConta(email, { senhaHash: hash, salt }, { derrubarSessoes: true });
  const res = NextResponse.json({ ok: true });
  await gravarSessao(res, atualizada);
  return res;
}
