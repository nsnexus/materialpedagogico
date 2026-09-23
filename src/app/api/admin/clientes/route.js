import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ehAdmin } from '@/lib/auth';
import { atualizarConta, criarTokenReset, getConta, listarContas } from '@/lib/contas';
import { urlDoSite } from '@/lib/email';

export const runtime = 'edge';

const naoAutorizado = () => NextResponse.json({ error: 'Faça login no painel.' }, { status: 401 });

// GET ?busca=<começo do e-mail>&cursor=
export async function GET(req) {
  if (!(await ehAdmin(cookies()))) return naoAutorizado();
  const { searchParams } = new URL(req.url);
  return NextResponse.json(await listarContas(searchParams.get('busca') || '', searchParams.get('cursor')));
}

// POST { email, acao: 'bloquear' | 'reativar' | 'link-senha' }
export async function POST(req) {
  if (!(await ehAdmin(cookies()))) return naoAutorizado();
  const { email, acao } = await req.json().catch(() => ({}));
  const conta = await getConta(email);
  if (!conta) return NextResponse.json({ error: 'Cliente não encontrada.' }, { status: 404 });

  if (acao === 'bloquear') {
    await atualizarConta(conta.email, { status: 'bloqueada' }, { derrubarSessoes: true });
    return NextResponse.json({ ok: true });
  }
  if (acao === 'reativar') {
    await atualizarConta(conta.email, { status: 'ativa' });
    return NextResponse.json({ ok: true });
  }
  if (acao === 'link-senha') {
    if (conta.status !== 'ativa') {
      return NextResponse.json({ error: 'Reative a cliente antes de gerar o link.' }, { status: 400 });
    }
    const token = await criarTokenReset(conta.email);
    return NextResponse.json({ ok: true, link: `${urlDoSite(req)}/redefinir?t=${token}` });
  }
  return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
}
