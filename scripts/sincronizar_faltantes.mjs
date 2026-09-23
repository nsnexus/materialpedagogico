import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { getPlatformProxy } from 'wrangler';

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

// Extrai URL de arquivo .url do Windows
function lerUrlDeArquivo(caminho) {
  const conteudo = readFileSync(caminho, 'utf8');
  const match = conteudo.match(/URL=(.+)/i);
  return match ? match[1].trim() : null;
}

async function main() {
  const pastaRaiz = 'C:/Users/narci/OneDrive/Documentos/PROJETOS/curso pedreiro/MATERIAL PEDAGOGICO';
  console.log('Iniciando conexão com R2 via Wrangler remoto...');
  const proxy = await getPlatformProxy({ configPath: 'scripts/wrangler.remoto.toml' });
  const bucket = proxy.env.ACERVO;

  // 1. Ler catálogo existente
  const catObj = await bucket.get('_catalogo.json');
  const catalogoAtual = catObj ? JSON.parse(await catObj.text()) : { arquivos: [] };
  console.log(`Catálogo atual possui ${catalogoAtual.arquivos.length} itens.`);

  // Mapa de itens existentes no catálogo indexados por chave (lowercase para conferência rápida)
  const itensPorChave = new Map();
  for (const item of catalogoAtual.arquivos) {
    itensPorChave.set(item.k.toLowerCase(), item);
  }

  // 2. Mapear arquivos locais
  async function listarArquivos(dir) {
    const lista = [];
    for (const item of await readdir(dir, { withFileTypes: true })) {
      const completo = path.join(dir, item.name);
      if (item.name.startsWith('.') || item.name.toLowerCase() === 'thumbs.db' || item.name.toLowerCase() === 'desktop.ini') continue;
      if (item.isDirectory()) {
        lista.push(...(await listarArquivos(completo)));
      } else {
        const rel = path.relative(pastaRaiz, completo).split(path.sep).join('/');
        lista.push({ completo, rel, nome: item.name, tamanho: (await stat(completo)).size });
      }
    }
    return lista;
  }

  const arquivosLocais = await listarArquivos(pastaRaiz);
  console.log(`Total de arquivos encontrados localmente: ${arquivosLocais.length}`);

  const novosItensCatalogo = [...catalogoAtual.arquivos];
  let enviados = 0;
  let pulados = 0;
  let linksAdicionados = 0;

  for (const arq of arquivosLocais) {
    // Se for o arquivo de documentação markdown, não precisa subir para o acervo de alunos
    if (arq.nome.toLowerCase() === 'catalogo_material_pedagogico.md') {
      console.log(`[PULAR] Documentação ${arq.rel}`);
      continue;
    }

    // Se for atalho .url do Windows, vamos cadastrar no catálogo como link externo acessível no portal
    if (arq.nome.toLowerCase().endsWith('.url')) {
      const urlDestino = lerUrlDeArquivo(arq.completo);
      if (urlDestino) {
        // Formata o título limpo para o link
        const pasta = path.dirname(arq.rel).split(path.sep).join('/');
        const titulo = arq.nome.replace(/\.url$/i, '');
        const chaveLink = `${pasta}/${titulo}`;

        // Verifica se já existe esse link no catálogo
        const existe = novosItensCatalogo.some(a => a.k.toLowerCase() === chaveLink.toLowerCase() || a.url === urlDestino);
        if (!existe) {
          console.log(`[NOVO LINK] Adicionando link externo: "${chaveLink}" -> ${urlDestino}`);
          novosItensCatalogo.push({
            k: chaveLink,
            url: urlDestino,
            link: true
          });
          linksAdicionados++;
        } else {
          console.log(`[LINK JÁ EXISTE] ${chaveLink}`);
        }
      }
      continue;
    }

    // Arquivos normais (PDF, ZIP, DOCX, etc.)
    const chaveR2 = arq.rel;
    const ext = chaveR2.split('.').pop().toLowerCase();
    const contentType = TIPOS[ext] || 'application/octet-stream';

    // Checa se já existe no bucket com o mesmo tamanho
    let head = null;
    try {
      head = await bucket.head(chaveR2);
    } catch (e) {}

    // Caso não exista exata, verificar se existe com outro case (ex: Caderno vs CARDERNO)
    if (!head) {
      // Também verifica no catálogo se já existe
      const itemExistente = itensPorChave.get(chaveR2.toLowerCase());
      if (itemExistente && itemExistente.t === arq.tamanho) {
        console.log(`[JÁ EXISTE NO R2 (variação de nome)] ${chaveR2} -> coincide com ${itemExistente.k}`);
        pulados++;
        continue;
      }
    }

    if (head && head.size === arq.tamanho) {
      console.log(`[JÁ EXISTE] ${chaveR2} (${arq.tamanho} bytes)`);
      pulados++;
      // Garante que está no catálogo
      if (!novosItensCatalogo.some(a => a.k === chaveR2)) {
        novosItensCatalogo.push({ k: chaveR2, t: arq.tamanho });
      }
      continue;
    }

    console.log(`[ENVIANDO] ${chaveR2} (${(arq.tamanho / 1024 / 1024).toFixed(2)} MB)...`);
    const buffer = await readFile(arq.completo);
    await bucket.put(chaveR2, buffer, { httpMetadata: { contentType } });
    enviados++;
    console.log(`  -> Sucesso: ${chaveR2}`);

    // Atualiza ou adiciona no catálogo
    const idx = novosItensCatalogo.findIndex(a => a.k === chaveR2);
    if (idx >= 0) {
      novosItensCatalogo[idx] = { k: chaveR2, t: arq.tamanho };
    } else {
      novosItensCatalogo.push({ k: chaveR2, t: arq.tamanho });
    }
  }

  // Ordenar catálogo alfabeticamente
  novosItensCatalogo.sort((a, b) => a.k.localeCompare(b.k, 'pt-BR'));

  console.log(`\nSalvando catálogo atualizado com ${novosItensCatalogo.length} itens...`);
  await bucket.put('_catalogo.json', JSON.stringify({
    geradoEm: new Date().toISOString(),
    arquivos: novosItensCatalogo
  }, null, 2), {
    httpMetadata: { contentType: 'application/json' }
  });

  console.log(`\n=== CONCLUÍDO COM SUCESSO ===`);
  console.log(`Arquivos novos enviados: ${enviados}`);
  console.log(`Links externos adicionados: ${linksAdicionados}`);
  console.log(`Arquivos já existentes pulados: ${pulados}`);
  console.log(`Total final no catálogo: ${novosItensCatalogo.length}`);

  await proxy.dispose();
}

main().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
