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

// Cria ou ativa a conta com os dados do pedido pago. Conta já ativa não é alterada.
export async function ativarConta(pedido, txid) {
  const email = normalizarEmail(pedido.email || pedido.conta?.email);
  const existente = await getConta(email);
  if (existente?.status === 'ativa') return existente;
  const dadosBase = existente?.senhaHash ? existente : (pedido.conta || {});
  const conta = {
    ...dadosBase,
    whatsapp: existente?.whatsapp || pedido.whatsapp || pedido.conta?.whatsapp || '',
    status: 'ativa',
    txid: txid || existente?.txid,
    criadoEm: existente?.criadoEm || new Date().toISOString(),
    pagoEm: new Date().toISOString(),
  };
  await salvarConta(conta);
  return conta;
}

// Criação direta e manual de cliente pelo painel administrativo
export async function criarContaManual({ nome, email, whatsapp, senhaHash, salt }) {
  const normEmail = normalizarEmail(email);
  const existente = await getConta(normEmail);
  const agora = new Date().toISOString();
  const conta = {
    nome: String(nome || '').trim(),
    email: normEmail,
    whatsapp: String(whatsapp || '').replace(/\D/g, ''),
    senhaHash,
    salt,
    status: 'ativa',
    txid: `MANUAL_${Date.now()}`,
    origem: 'admin',
    criadoEm: existente?.criadoEm || agora,
    pagoEm: agora,
    atualizadoEm: agora,
  };
  await salvarConta(conta);
  return conta;
}

// Altera a conta; com derrubarSessoes, todas as sessões abertas dela deixam de valer.
export async function atualizarConta(email, alteracoes, { derrubarSessoes = false } = {}) {
  const conta = await getConta(email);
  if (!conta) return null;
  const nova = { ...conta, ...alteracoes, versao: (conta.versao || 0) + (derrubarSessoes ? 1 : 0) };
  await salvarConta(nova);
  return nova;
}

// Lista contas por prefixo do e-mail, 50 por página.
export async function listarContas(prefixo = '', cursor) {
  const pagina = await store().list({ prefix: `conta:${normalizarEmail(prefixo)}`, limit: 50, cursor: cursor || undefined });
  const contas = await Promise.all(pagina.keys.map((k) => store().get(k.name, 'json')));
  return {
    contas: contas
      .filter(Boolean)
      .map(({ nome, email, whatsapp, status, criadoEm, pagoEm, txid }) => ({
        nome,
        email,
        whatsapp: whatsapp || '',
        status,
        criadoEm,
        pagoEm: pagoEm || null,
        txid: txid || null,
      })),
    cursor: pagina.list_complete ? null : pagina.cursor,
  };
}

// --- Redefinição de senha: token aleatório de uso único, guardado só como hash, válido por 1 hora ---
const TTL_RESET = 3600;

async function hashToken(token) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function criarTokenReset(email) {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  await store().put(`reset:${await hashToken(token)}`, normalizarEmail(email), { expirationTtl: TTL_RESET });
  return token;
}

export async function consumirTokenReset(token) {
  if (!/^[0-9a-f]{64}$/.test(String(token || ''))) return null;
  const chave = `reset:${await hashToken(token)}`;
  const email = await store().get(chave);
  if (email) await store().delete(chave);
  return email;
}

// Limite genérico por chave (ex: pedidos de reset por e-mail).
export async function dentroDoLimite(chave, maximo, janelaSeg) {
  const n = Number((await store().get(`limite:${chave}`)) || 0);
  if (n >= maximo) return false;
  await store().put(`limite:${chave}`, String(n + 1), { expirationTtl: janelaSeg });
  return true;
}

// Limite simples de tentativas de login por e-mail (10 a cada 15 min).
export async function podeTentarLogin(email) {
  const chave = `tentativas:${normalizarEmail(email)}`;
  const n = Number((await store().get(chave)) || 0);
  if (n >= 10) return false;
  await store().put(chave, String(n + 1), { expirationTtl: 900 });
  return true;
}
