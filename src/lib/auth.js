// Senhas (PBKDF2) e sessão em cookie assinado (HMAC-SHA256), só com Web Crypto.
import { variavel } from '@/lib/env';
import { getConta } from '@/lib/contas';

export const COOKIE_SESSAO = 'bp_sessao';
export const COOKIE_PEDIDO = 'bp_pedido';
const SESSAO_DIAS = 30;
const ITERACOES = 100000; // máximo aceito pelo PBKDF2 do Workers

const enc = new TextEncoder();

function b64url(bytes) {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function deB64url(str) {
  const s = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

function iguais(a, b) {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

function segredo() {
  const s = variavel('SESSION_SECRET');
  if (s) return s;
  if (process.env.NODE_ENV === 'development') return 'segredo-local-apenas-dev';
  throw new Error('SESSION_SECRET não configurado.');
}

export async function hashSenha(senha, saltB64) {
  const salt = saltB64 ? deB64url(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const chave = await crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERACOES }, chave, 256);
  return { hash: b64url(bits), salt: b64url(salt) };
}

export async function conferirSenha(senha, conta) {
  if (!conta?.senhaHash || !conta?.salt) return false;
  const { hash } = await hashSenha(senha, conta.salt);
  return iguais(hash, conta.senhaHash);
}

async function assinar(texto) {
  const chave = await crypto.subtle.importKey('raw', enc.encode(segredo()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', chave, enc.encode(texto)));
}

async function criarToken(dados, dias) {
  const payload = b64url(enc.encode(JSON.stringify({ ...dados, exp: Date.now() + dias * 864e5 })));
  return `${payload}.${await assinar(payload)}`;
}

export function criarTokenSessao(email) {
  return criarToken({ email }, SESSAO_DIAS);
}

export async function lerTokenSessao(token) {
  if (!token || !token.includes('.')) return null;
  const [payload, assinatura] = token.split('.');
  if (!iguais(assinatura, await assinar(payload))) return null;
  try {
    const dados = JSON.parse(new TextDecoder().decode(deB64url(payload)));
    return dados.exp > Date.now() ? dados : null;
  } catch (e) {
    return null;
  }
}

export function opcoesCookie(maxAgeSeg) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeg,
  };
}

export async function gravarSessao(res, email) {
  res.cookies.set(COOKIE_SESSAO, await criarTokenSessao(email), opcoesCookie(SESSAO_DIAS * 86400));
}

// --- Admin: senha única em ADMIN_PASSWORD, sessão de 7 dias em cookie próprio ---
export const COOKIE_ADMIN = 'bp_admin';
const ADMIN_DIAS = 7;

export async function conferirSenhaAdmin(senha) {
  const certa = variavel('ADMIN_PASSWORD');
  if (!certa) return false;
  // Compara os hashes para não vazar o tamanho da senha pelo tempo de resposta.
  const h = async (s) => b64url(await crypto.subtle.digest('SHA-256', enc.encode(s)));
  return iguais(await h(senha), await h(certa));
}

export async function gravarSessaoAdmin(res) {
  res.cookies.set(COOKIE_ADMIN, await criarToken({ admin: true }, ADMIN_DIAS), opcoesCookie(ADMIN_DIAS * 86400));
}

export async function ehAdmin(cookies) {
  const dados = await lerTokenSessao(cookies.get(COOKIE_ADMIN)?.value);
  return dados?.admin === true;
}

// Sessão válida + conta ativa. Retorna a conta ou null.
export async function contaDaSessao(cookies) {
  const sessao = await lerTokenSessao(cookies.get(COOKIE_SESSAO)?.value);
  if (!sessao) return null;
  const conta = await getConta(sessao.email);
  return conta?.status === 'ativa' ? conta : null;
}
