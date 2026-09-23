// Envio de e-mail pela API do Resend (https://resend.com). Sem RESEND_API_KEY, emailConfigurado() é false
// e as telas mandam a cliente falar com o suporte.
import { variavel } from '@/lib/env';
import { SITE } from '@/lib/site';

export function emailConfigurado() {
  return Boolean(variavel('RESEND_API_KEY') && variavel('EMAIL_REMETENTE'));
}

export async function enviarEmail({ para, assunto, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${variavel('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: variavel('EMAIL_REMETENTE'), to: [para], subject: assunto, html }),
  });
  if (!res.ok) throw new Error(`Resend HTTP ${res.status}: ${await res.text()}`);
}

// Base pública do site para montar links (não confia no Host da requisição).
export function urlDoSite(req) {
  return variavel('NEXT_PUBLIC_SITE_URL') || new URL(req.url).origin;
}

export function htmlRedefinirSenha(nome, link) {
  const escapar = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const primeiro = escapar(String(nome || '').split(' ')[0] || 'Olá');
  return `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#1f2a44">
    <h2 style="color:#ff6b4a">🧰 ${SITE.marca}</h2>
    <p>${primeiro}, recebemos um pedido para criar uma nova senha de acesso ao portal.</p>
    <p style="margin:28px 0">
      <a href="${link}" style="background:#16a864;color:#fff;padding:14px 26px;border-radius:999px;text-decoration:none;font-weight:bold">
        Criar nova senha
      </a>
    </p>
    <p style="font-size:13px;color:#4a5572">O link vale por 1 hora e só pode ser usado uma vez.
    Se não foi você, é só ignorar este e-mail: sua senha continua a mesma.</p>
  </div>`;
}
