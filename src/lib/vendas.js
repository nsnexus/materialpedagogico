// Pedidos (txid -> cliente) e registro de compras reais para as notificações "fulano garantiu o acesso".
import { kv } from '@/lib/env';

const MAX_RECENTES = 20;
const TTL_PEDIDO = 60 * 60 * 48; // pedido pendente expira em 48h

// "maria da silva" -> "Maria S." (só primeiro nome e inicial, nunca e-mail)
export function nomePublico(nomeCompleto) {
  const partes = String(nomeCompleto || '').trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return null;
  const cap = (s) => s.charAt(0).toLocaleUpperCase('pt-BR') + s.slice(1).toLocaleLowerCase('pt-BR');
  const primeiro = cap(partes[0]).slice(0, 20);
  const ultimo = partes.length > 1 ? ` ${partes[partes.length - 1].charAt(0).toLocaleUpperCase('pt-BR')}.` : '';
  return primeiro + ultimo;
}

// dadosConta: { nome, email, senhaHash, salt } — vira conta só quando o Pix deste txid for pago.
export async function registrarPedido(txid, dadosConta) {
  const store = kv();
  if (!store) throw new Error('Binding BAU_KV não configurado.');
  await store.put(`pedido:${txid}`, JSON.stringify({ conta: dadosConta, email: dadosConta.email, nome: nomePublico(dadosConta.nome) }), { expirationTtl: TTL_PEDIDO });
}

export async function getPedido(txid) {
  const store = kv();
  return store ? store.get(`pedido:${txid}`, 'json') : null;
}

export async function registrarVenda(txid) {
  const store = kv();
  if (!store) return;
  const pedido = await store.get(`pedido:${txid}`, 'json');
  if (!pedido || pedido.registrado) return;

  await store.put(`pedido:${txid}`, JSON.stringify({ ...pedido, registrado: true }), { expirationTtl: TTL_PEDIDO });
  const recentes = (await store.get('recentes', 'json')) || [];
  recentes.unshift({ nome: pedido.nome, ts: Date.now() });
  await store.put('recentes', JSON.stringify(recentes.slice(0, MAX_RECENTES)));
}

export async function listarVendasRecentes() {
  const store = kv();
  if (!store) return [];
  return (await store.get('recentes', 'json')) || [];
}
