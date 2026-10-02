import { NextResponse } from 'next/server';
import { getConta, normalizarEmail, podeTentarLogin, salvarConta } from '@/lib/contas';
import { conferirSenha, gravarSessao } from '@/lib/auth';
import { getPixCharge } from '@/lib/pay';
import { SITE } from '@/lib/site';
import { registrarVenda } from '@/lib/vendas';

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
    if (conta.status === 'pendente') {
      // Reconciliação automática: se o cliente já pagou e fechou a janela do checkout,
      // consultamos o gateway diretamente pelo txid da conta.
      if (conta.txid) {
        try {
          const charge = await getPixCharge(conta.txid, { appId: SITE.appId, amount: SITE.preco });
          const pago = charge?.status === 'PAID' && Number(charge.paidAmount ?? charge.amount) >= SITE.preco;
          if (pago) {
            conta.status = 'ativa';
            conta.pagoEm = new Date().toISOString();
            await salvarConta(conta);
            await registrarVenda(conta.txid).catch(() => {});

            const res = NextResponse.json({ ok: true, reconciliado: true });
            await gravarSessao(res, conta);
            return res;
          }
        } catch (e) {
          console.warn('[POST /api/entrar] Falha ao reconciliar Pix:', e.message);
        }
      }
      return NextResponse.json(
        {
          error: 'Pagamento Pix pendente. Se você acabou de pagar, aguarde 1 minuto para o banco compensar e tente de novo.',
          pendente: true,
          txid: conta.txid,
        },
        { status: 402 }
      );
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
