import { NextResponse } from 'next/server';
import { createPixCharge } from '@/lib/pay';
import { SITE } from '@/lib/site';
import { registrarPedido } from '@/lib/vendas';
import { EMAIL_RE, getConta, normalizarEmail } from '@/lib/contas';
import { COOKIE_PEDIDO, hashSenha, opcoesCookie } from '@/lib/auth';

export const runtime = 'edge';

export async function POST(req) {
  let body = {};
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const nome = String(body.nome || '').trim().slice(0, 120);
  const email = normalizarEmail(body.email);
  const senha = String(body.senha || '');
  if (nome.length < 2) return NextResponse.json({ error: 'Informe seu nome.' }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 });
  if (senha.length < 6 || senha.length > 128) {
    return NextResponse.json({ error: 'A senha precisa ter pelo menos 6 caracteres.' }, { status: 400 });
  }

  try {
    const existente = await getConta(email);
    if (existente?.status === 'ativa') {
      return NextResponse.json(
        { error: 'Este e-mail já tem acesso. Entre no portal com sua senha.', jaTemAcesso: true },
        { status: 409 }
      );
    }

    // Valor vem sempre do servidor, nunca do cliente.
    const externalOrderId = `BP-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
    const charge = await createPixCharge({
      appId: SITE.appId,
      externalOrderId,
      amount: SITE.preco,
      description: `${SITE.marca} - acesso vitalício`,
      payer: { name: nome, email },
    });

    // A conta só é criada quando este Pix for pago (ver /api/status).
    const { hash, salt } = await hashSenha(senha);
    await registrarPedido(charge.txid, { nome, email, senhaHash: hash, salt });

    const res = NextResponse.json({ txid: charge.txid, pixCopiaECola: charge.pixCopiaECola, amount: charge.amount });
    // Só o navegador que gerou o Pix recebe a sessão quando ele for pago.
    res.cookies.set(COOKIE_PEDIDO, charge.txid, opcoesCookie(60 * 60 * 48));
    return res;
  } catch (err) {
    console.error('[POST /api/checkout]', err.message);
    return NextResponse.json({ error: 'Não foi possível gerar o Pix agora. Tente de novo em instantes.' }, { status: 502 });
  }
}
