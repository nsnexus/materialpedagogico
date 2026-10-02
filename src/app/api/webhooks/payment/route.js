import { NextResponse } from 'next/server';
import { variavel } from '@/lib/env';
import { SITE } from '@/lib/site';
import { getConta, salvarConta } from '@/lib/contas';
import { getPedido, registrarVenda } from '@/lib/vendas';

export const runtime = 'edge';

export async function POST(req) {
  try {
    // 1. Validação de segurança: confere se a requisição veio do gateway oficial
    const signature =
      req.headers.get('x-gateway-signature') ||
      req.headers.get('x-gateway-secret') ||
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    const expectedSecret = String(variavel('NSNEXUS_GATEWAY_API_KEY') || '').trim();

    if (expectedSecret && signature !== expectedSecret) {
      return NextResponse.json({ error: 'Não autorizado: assinatura inválida.' }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const { event, appId, txid, amount, status } = payload;

    // Só processa pagamentos do próprio aplicativo
    if (appId && appId !== SITE.appId) {
      return NextResponse.json({ error: 'appId divergente deste site.' }, { status: 400 });
    }

    const pago = (event === 'payment.approved' || status === 'PAID') && Number(amount || 0) >= SITE.preco;
    if (!pago || !txid) {
      return NextResponse.json({ ok: true, ignorado: true });
    }

    // 2. Busca o pedido pelo txid
    const pedido = await getPedido(txid);
    const email = pedido?.email || pedido?.conta?.email;

    if (email) {
      const conta = await getConta(email);
      if (conta) {
        conta.status = 'ativa';
        conta.txid = txid;
        conta.pagoEm = new Date().toISOString();
        await salvarConta(conta);
      }
    }

    // 3. Registra para a notificação de vendas recentes na landing page
    await registrarVenda(txid).catch((e) => console.warn('[webhook] Erro ao registrar venda:', e.message));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/webhooks/payment] Erro:', err.message);
    return NextResponse.json({ error: err.message || 'Falha ao processar webhook.' }, { status: 500 });
  }
}
