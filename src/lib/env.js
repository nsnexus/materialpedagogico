// Acesso às variáveis e bindings do Cloudflare (KV, R2) nas rotas edge.
import { getRequestContext } from '@cloudflare/next-on-pages';

export function cfEnv() {
  try {
    return getRequestContext()?.env || {};
  } catch (e) {
    return {};
  }
}

export function variavel(nome) {
  return cfEnv()[nome] || process.env[nome];
}

export const kv = () => cfEnv().BAU_KV || null;
export const acervo = () => cfEnv().ACERVO || null;
