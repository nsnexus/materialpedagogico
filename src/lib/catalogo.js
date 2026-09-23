// Catálogo do portal (_catalogo.json no R2). Itens: { k: 'Pasta/Sub/nome.pdf', t: bytes } para arquivos
// e { k: 'Pasta/Título', url, link: true } para links externos.
import { acervo } from '@/lib/env';

const CHAVE = '_catalogo.json';

function bucket() {
  const b = acervo();
  if (!b) throw new Error('Binding ACERVO não configurado.');
  return b;
}

export async function lerCatalogo() {
  const obj = await bucket().get(CHAVE);
  return obj ? await obj.json() : { geradoEm: null, arquivos: [] };
}

export async function salvarCatalogo(arquivos) {
  const ordenados = [...arquivos].sort((a, b) => a.k.localeCompare(b.k, 'pt-BR'));
  await bucket().put(CHAVE, JSON.stringify({ geradoEm: new Date().toISOString(), arquivos: ordenados }), {
    httpMetadata: { contentType: 'application/json' },
  });
}

// "Gestão Escolar / Planos " -> "Gestão Escolar/Planos". Rejeita caminhos perigosos.
export function limparCaminho(caminho) {
  const partes = String(caminho || '')
    .split('/')
    .map((p) => p.replace(/[\\<>:"|?*\u0000-\u001f]/g, '').trim())
    .filter(Boolean);
  if (partes.some((p) => p === '.' || p === '..' || p.startsWith('_'))) throw new Error('Nome de pasta inválido.');
  return partes.join('/');
}

export async function adicionarItem(item) {
  const { arquivos } = await lerCatalogo();
  await salvarCatalogo([...arquivos.filter((a) => a.k !== item.k), item]);
}

export async function removerItem(chave) {
  const { arquivos } = await lerCatalogo();
  const item = arquivos.find((a) => a.k === chave);
  if (!item) return false;
  if (!item.link) await bucket().delete(chave);
  await salvarCatalogo(arquivos.filter((a) => a.k !== chave));
  return true;
}

export async function enviarArquivo(chave, corpo, tipo) {
  await bucket().put(chave, corpo, { httpMetadata: { contentType: tipo || 'application/octet-stream' } });
}
