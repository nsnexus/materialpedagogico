import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ehAdmin } from '@/lib/auth';
import { adicionarItem, enviarArquivo, lerCatalogo, limparCaminho, removerItem } from '@/lib/catalogo';
import { kv } from '@/lib/env';
import { listarVendasRecentes } from '@/lib/vendas';

export const runtime = 'edge';

const naoAutorizado = () => NextResponse.json({ error: 'Faça login no painel.' }, { status: 401 });
const erro = (msg, status = 400) => NextResponse.json({ error: msg }, { status });

// GET: catálogo + resumo (clientes e vendas recentes)
export async function GET() {
  if (!(await ehAdmin(cookies()))) return naoAutorizado();
  const [catalogo, vendas, contas] = await Promise.all([
    lerCatalogo(),
    listarVendasRecentes(),
    kv()?.list({ prefix: 'conta:' }),
  ]);
  return NextResponse.json({
    arquivos: catalogo.arquivos,
    geradoEm: catalogo.geradoEm,
    clientes: contas?.keys.length ?? 0,
    maisClientes: contas ? !contas.list_complete : false,
    vendas,
  });
}

// POST multipart: pasta + arquivo  |  POST JSON: { pasta, titulo, url } para link
export async function POST(req) {
  if (!(await ehAdmin(cookies()))) return naoAutorizado();
  try {
    if ((req.headers.get('content-type') || '').includes('multipart/form-data')) {
      const form = await req.formData();
      const pasta = limparCaminho(form.get('pasta'));
      const arquivo = form.get('arquivo');
      if (!pasta) return erro('Escolha a pasta.');
      if (!arquivo || typeof arquivo === 'string' || !arquivo.size) return erro('Selecione um arquivo.');
      const nome = limparCaminho(arquivo.name.replace(/\//g, '-'));
      const chave = `${pasta}/${nome}`;
      await enviarArquivo(chave, await arquivo.arrayBuffer(), arquivo.type);
      await adicionarItem({ k: chave, t: arquivo.size });
      return NextResponse.json({ ok: true, k: chave });
    }

    const { pasta, titulo, url } = await req.json();
    const pastaLimpa = limparCaminho(pasta);
    const tituloLimpo = limparCaminho(String(titulo || '').replace(/\//g, '-'));
    if (!pastaLimpa || !tituloLimpo) return erro('Preencha pasta e título.');
    let link;
    try {
      link = new URL(String(url || '').trim());
    } catch (e) {
      return erro('Link inválido. Use o endereço completo, começando com https://');
    }
    if (!['https:', 'http:'].includes(link.protocol)) return erro('O link precisa começar com https://');
    const chave = `${pastaLimpa}/${tituloLimpo}`;
    await adicionarItem({ k: chave, url: link.toString(), link: true });
    return NextResponse.json({ ok: true, k: chave });
  } catch (e) {
    console.error('[POST /api/admin/catalogo]', e.message);
    return erro(e.message || 'Falha ao salvar.', 500);
  }
}

// DELETE ?k=<chave>
export async function DELETE(req) {
  if (!(await ehAdmin(cookies()))) return naoAutorizado();
  const chave = new URL(req.url).searchParams.get('k') || '';
  if (!chave || chave.startsWith('_')) return erro('Item inválido.');
  const ok = await removerItem(chave);
  return ok ? NextResponse.json({ ok: true }) : erro('Item não encontrado.', 404);
}
