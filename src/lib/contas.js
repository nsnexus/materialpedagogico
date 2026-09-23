// Contas de clientes no KV. Chave: conta:<email>. Status: 'pendente' até o Pix confirmar, depois 'ativa'.
import { kv } from '@/lib/env';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizarEmail(email) {
  return String(email || '').trim().toLowerCase().slice(0, 160);
}

function store() {
  const s = kv();
  if (!s) throw new Error('Binding BAU_KV não configurado.');
  return s;
}

export async function getConta(email) {
  return store().get(`conta:${normalizarEmail(email)}`, 'json');
}

export async function salvarConta(conta) {
  await store().put(`conta:${conta.email}`, JSON.stringify(conta));
}

// Cria a conta com os dados do pedido pago. Conta já ativa não é alterada.
export async function ativarConta(pedido, txid) {
  const existente = await getConta(pedido.email);
  if (existente?.status === 'ativa') return existente;
  const conta = { ...pedido.conta, status: 'ativa', txid, criadoEm: new Date().toISOString() };
  await salvarConta(conta);
  return conta;
}

// Limite simples de tentativas de login por e-mail (10 a cada 15 min).
export async function podeTentarLogin(email) {
  const chave = `tentativas:${normalizarEmail(email)}`;
  const n = Number((await store().get(chave)) || 0);
  if (n >= 10) return false;
  await store().put(chave, String(n + 1), { expirationTtl: 900 });
  return true;
}
