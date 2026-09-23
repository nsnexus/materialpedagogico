import { NextResponse } from 'next/server';
import { getPixCharge } from '@/lib/pay';
import { SITE } from '@/lib/site';
import { getPedido, registrarVenda } from '@/lib/vendas';
import { ativarConta } from '@/lib/contas';
import { COOKIE_PEDIDO, gravarSessao } from '@/lib/auth';

export const runtime = 'edge';

export async function GET(req, { params }) {
  const txid = String(params?.txid || '');
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(txid)) {
    return NextResponse.json({ error: 'txid inválido.' }, { status: 400 });
  }

  try {
    const charge = await getPixCharge(txid, { appId: SITE.appId, amount: SITE.preco });
    // Só libera cobranças deste site; o gateway é compartilhado com outros apps.
    if (!charge || charge.appId !== SITE.appId) {
      return NextResponse.json({ error: 'Cobrança não encontrada.' }, { status: 404 });
    }

    const pago = charge.status === 'PAID' && Number(charge.paidAmount ?? charge.amount) >= SITE.preco;
    if (!pago) return NextResponse.json({ status: 'PENDING' });

    const pedido = await getPedido(txid);
    const conta = pedido?.conta ? await ativarConta(pedido, txid) : null;
    await registrarVenda(txid).catch((e) => console.warn('[status] vendas:', e.message));

    const res = NextResponse.json({ status: 'PAID' });
    if (conta?.status === 'ativa' && req.cookies.get(COOKIE_PEDIDO)?.value === txid) {
      await gravarSessao(res, conta);
      res.cookies.delete(COOKIE_PEDIDO);
    }
    return res;
  } catch (err) {
    console.error('[GET /api/status]', err.message);
    return NextResponse.json({ error: 'Falha ao consultar pagamento.' }, { status: 502 });
  }
}
