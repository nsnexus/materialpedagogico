import { NextResponse } from 'next/server';
import { EMAIL_RE, criarTokenReset, dentroDoLimite, getConta, normalizarEmail } from '@/lib/contas';
import { emailConfigurado, enviarEmail, htmlRedefinirSenha, urlDoSite } from '@/lib/email';
import { SITE } from '@/lib/site';

export const runtime = 'edge';

// Responde igual exista ou não a conta, para não revelar quais e-mails são clientes.
export async function POST(req) {
  if (!emailConfigurado()) {
    return NextResponse.json({ semEmail: true }, { status: 503 });
  }
  const { email: bruto } = await req.json().catch(() => ({}));
  const email = normalizarEmail(bruto);
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 });

  try {
    const conta = await getConta(email);
    if (conta?.status === 'ativa' && (await dentroDoLimite(`reset:${email}`, 3, 3600))) {
      const token = await criarTokenReset(email);
      await enviarEmail({
        para: email,
        assunto: `${SITE.marca}: crie sua nova senha`,
        html: htmlRedefinirSenha(conta.nome, `${urlDoSite(req)}/redefinir?t=${token}`),
      });
    }
  } catch (err) {
    console.error('[POST /api/senha/esqueci]', err.message);
  }
  return NextResponse.json({ ok: true });
}
