import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ehAdmin, hashSenha } from '@/lib/auth';
import { atualizarConta, criarContaManual, criarTokenReset, getConta, listarContas, EMAIL_RE, normalizarEmail } from '@/lib/contas';
import { urlDoSite } from '@/lib/email';

export const runtime = 'edge';

const naoAutorizado = () => NextResponse.json({ error: 'Faça login no painel.' }, { status: 401 });

// GET ?busca=<começo do e-mail>&cursor=&status=
export async function GET(req) {
  if (!(await ehAdmin(cookies()))) return naoAutorizado();
  const { searchParams } = new URL(req.url);
  const busca = searchParams.get('busca') || '';
  const cursor = searchParams.get('cursor');
  const statusFiltro = searchParams.get('status') || '';

  const res = await listarContas(busca, cursor);
  if (statusFiltro && statusFiltro !== 'todas') {
    res.contas = res.contas.filter((c) => c.status === statusFiltro);
  }
  return NextResponse.json(res);
}

// POST { acao, email, nome, whatsapp, senha }
export async function POST(req) {
  if (!(await ehAdmin(cookies()))) return naoAutorizado();
  const body = await req.json().catch(() => ({}));
  const { acao, email } = body;

  // 1. Criação manual de novo cliente direto pelo admin
  if (acao === 'criar-manual') {
    const nome = String(body.nome || '').trim();
    const emailNorm = normalizarEmail(body.email);
    const whatsapp = String(body.whatsapp || '').replace(/\D/g, '');
    const senha = String(body.senha || '123456');

    if (!nome) return NextResponse.json({ error: 'Informe o nome do cliente.' }, { status: 400 });
    if (!EMAIL_RE.test(emailNorm)) return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 });
    if (senha.length < 6) return NextResponse.json({ error: 'A senha precisa ter no mínimo 6 caracteres.' }, { status: 400 });

    const { hash, salt } = await hashSenha(senha);
    const conta = await criarContaManual({ nome, email: emailNorm, whatsapp, senhaHash: hash, salt });
    return NextResponse.json({ ok: true, conta: { nome: conta.nome, email: conta.email, status: conta.status } });
  }

  // Ações que exigem cliente existente
  const conta = await getConta(email);
  if (!conta) return NextResponse.json({ error: 'Cliente não encontrada.' }, { status: 404 });

  if (acao === 'bloquear') {
    await atualizarConta(conta.email, { status: 'bloqueada' }, { derrubarSessoes: true });
    return NextResponse.json({ ok: true });
  }

  if (acao === 'reativar' || acao === 'liberar-manual') {
    await atualizarConta(conta.email, { status: 'ativa', pagoEm: conta.pagoEm || new Date().toISOString() });
    return NextResponse.json({ ok: true });
  }

  if (acao === 'link-senha') {
    if (conta.status !== 'ativa') {
      return NextResponse.json({ error: 'Ative a cliente antes de gerar o link.' }, { status: 400 });
    }
    const token = await criarTokenReset(conta.email);
    return NextResponse.json({ ok: true, link: `${urlDoSite(req)}/redefinir?t=${token}` });
  }

  return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
}
