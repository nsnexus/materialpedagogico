// Sobe a pasta do acervo para o Cloudflare R2 e gera o _catalogo.json usado pelo portal.
//
// Uso:
//   node scripts/subir-acervo.mjs "C:\caminho\do\acervo"           -> R2 de produção (login do wrangler)
//   node scripts/subir-acervo.mjs "C:\caminho\do\acervo" --local   -> R2 simulado do `next dev`
//   node scripts/subir-acervo.mjs "C:\caminho\do\acervo" --s3      -> R2 de produção via API S3
//
// A estrutura de pastas vira a navegação do portal: a 1ª pasta é a categoria.
// O modo --s3 precisa de R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY e R2_BUCKET no .env.local.
// Arquivos que já estão no bucket com o mesmo tamanho são pulados, então dá pra rodar de novo.
import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const IGNORAR = new Set(['thumbs.db', 'desktop.ini', '.ds_store']);
const TIPOS = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
};
const PARALELO = 12;

function carregarEnvLocal() {
  if (!existsSync('.env.local')) return;
  for (const linha of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

async function listar(raiz, dir = raiz) {
  const saida = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (item.name.startsWith('.') || IGNORAR.has(item.name.toLowerCase())) continue;
    const completo = path.join(dir, item.name);
    if (item.isDirectory()) saida.push(...(await listar(raiz, completo)));
    else if (item.isFile()) {
      const chave = path.relative(raiz, completo).split(path.sep).join('/');
      saida.push({ completo, chave, tamanho: (await stat(completo)).size });
    }
  }
  return saida;
}

async function destinoWrangler(remoto) {
  const { getPlatformProxy } = await import('wrangler');
  const proxy = await getPlatformProxy({ configPath: remoto ? 'scripts/wrangler.remoto.toml' : 'wrangler.toml' });
  const bucket = proxy.env.ACERVO;
  return {
    async tamanhoAtual(chave) {
      return (await bucket.head(chave))?.size ?? null;
    },
    async enviar(chave, corpo, tipo) {
      await bucket.put(chave, corpo, { httpMetadata: { contentType: tipo } });
    },
    async lerTexto(chave) {
      return (await bucket.get(chave))?.text() ?? null;
    },
    fechar: () => proxy.dispose(),
  };
}

async function destinoR2() {
  const { S3Client, HeadObjectCommand, PutObjectCommand, GetObjectCommand } = await import('@aws-sdk/client-s3');
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET = 'bau-acervo' } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error('Configure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY no .env.local');
  }
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
  return {
    async tamanhoAtual(chave) {
      try {
        return (await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: chave }))).ContentLength;
      } catch (e) {
        return null;
      }
    },
    async enviar(chave, corpo, tipo) {
      await s3.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: chave, Body: corpo, ContentType: tipo }));
    },
    async lerTexto(chave) {
      try {
        return await (await s3.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: chave }))).Body.transformToString();
      } catch (e) {
        return null;
      }
    },
    fechar: async () => s3.destroy(),
  };
}

async function main() {
  const raiz = process.argv[2];
  const local = process.argv.includes('--local');
  const s3 = process.argv.includes('--s3');
  if (!raiz || !existsSync(raiz)) {
    console.error('Uso: node scripts/subir-acervo.mjs "<pasta do acervo>" [--local | --s3]');
    process.exit(1);
  }
  carregarEnvLocal();

  const arquivos = await listar(path.resolve(raiz));
  console.log(`${arquivos.length} arquivos encontrados. Destino: ${local ? 'R2 local (dev)' : 'R2 produção'}`);
  const destino = s3 ? await destinoR2() : await destinoWrangler(!local);

  let feitos = 0;
  let enviados = 0;
  let falhas = 0;
  const fila = [...arquivos];
  async function trabalhador() {
    while (fila.length) {
      const a = fila.shift();
      try {
        if ((await destino.tamanhoAtual(a.chave)) !== a.tamanho) {
          const tipo = TIPOS[a.chave.split('.').pop().toLowerCase()] || 'application/octet-stream';
          await destino.enviar(a.chave, await readFile(a.completo), tipo);
          enviados += 1;
        }
      } catch (e) {
        falhas += 1;
        console.error(`\nFalha em ${a.chave}: ${e.message}`);
      }
      feitos += 1;
      if (feitos % 25 === 0 || feitos === arquivos.length) {
        process.stdout.write(`\r${feitos}/${arquivos.length} verificados · ${enviados} enviados · ${falhas} falhas`);
      }
    }
  }
  await Promise.all(Array.from({ length: PARALELO }, trabalhador));

  // Mantém no catálogo o que foi adicionado pelo painel (links e uploads que não estão nesta pasta).
  const locais = new Set(arquivos.map((a) => a.chave));
  const existente = JSON.parse((await destino.lerTexto('_catalogo.json')) || '{"arquivos":[]}').arquivos;
  const mantidos = existente.filter((a) => !locais.has(a.k));
  const catalogo = {
    geradoEm: new Date().toISOString(),
    arquivos: [...arquivos.map((a) => ({ k: a.chave, t: a.tamanho })), ...mantidos].sort((a, b) =>
      a.k.localeCompare(b.k, 'pt-BR')
    ),
  };
  await destino.enviar('_catalogo.json', JSON.stringify(catalogo), 'application/json');
  await destino.fechar();
  console.log(
    `\nCatálogo atualizado: ${arquivos.length} desta pasta + ${mantidos.length} já existentes.` +
      (falhas ? ` Rode de novo para refazer ${falhas} falha(s).` : '')
  );
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
