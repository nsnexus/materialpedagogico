// Script para criar ou ativar uma conta diretamente no KV (local ou remoto).
//
// Uso:
//   node scripts/ativar-cliente.mjs <email> [senha]           -> Ativa no KV de produção (Cloudflare)
//   node scripts/ativar-cliente.mjs <email> [senha] --local   -> Ativa no KV local do next dev
//
import { getPlatformProxy } from 'wrangler';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const local = process.argv.includes('--local');

const email = String(args[0] || '').trim().toLowerCase();
const senha = String(args[1] || '123456');

if (!email || !email.includes('@')) {
  console.error('Uso: node scripts/ativar-cliente.mjs <email> [senha] [--local]');
  process.exit(1);
}

// PBKDF2 compatível com src/lib/auth.js
async function hashSenha(texto, saltHex) {
  const enc = new TextEncoder();
  const salt = saltHex
    ? new Uint8Array(saltHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)))
    : crypto.getRandomValues(new Uint8Array(16));
  const chaveBase = await crypto.subtle.importKey('raw', enc.encode(texto), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    chaveBase,
    256
  );
  const hash = [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('');
  const saltSaida = [...salt].map((b) => b.toString(16).padStart(2, '0')).join('');
  return { hash, salt: saltSaida };
}

async function main() {
  console.log(`Conectando ao KV (${local ? 'LOCAL (.wrangler)' : 'REMOTO (Cloudflare)'})...`);
  const proxy = await getPlatformProxy({
    configPath: local ? 'wrangler.toml' : 'scripts/wrangler.remoto.toml',
  });

  const kv = proxy.env.BAU_KV;
  if (!kv) {
    console.error('Erro: binding BAU_KV não encontrado no wrangler.');
    process.exit(1);
  }

  const chave = `conta:${email}`;
  const existenteStr = await kv.get(chave);
  const existente = existenteStr ? JSON.parse(existenteStr) : null;

  let hash = existente?.senhaHash;
  let salt = existente?.salt;

  if (!hash || args[1]) {
    const res = await hashSenha(senha);
    hash = res.hash;
    salt = res.salt;
  }

  const conta = {
    nome: existente?.nome || email.split('@')[0],
    email,
    senhaHash: hash,
    salt,
    status: 'ativa',
    txid: existente?.txid || `MANUAL_${Date.now()}`,
    criadoEm: existente?.criadoEm || new Date().toISOString(),
    pagoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  };

  await kv.put(chave, JSON.stringify(conta));
  console.log(`\n Conta ativada com sucesso!`);
  console.log(`- E-mail: ${conta.email}`);
  console.log(`- Status: ${conta.status}`);
  console.log(`- Senha definida: ${args[1] ? senha : (existente?.senhaHash ? '(mantida a senha anterior)' : senha)}`);
  console.log(`- Login disponível em: /entrar`);

  await proxy.dispose();
}

main().catch((err) => {
  console.error('Falha:', err);
  process.exit(1);
});
