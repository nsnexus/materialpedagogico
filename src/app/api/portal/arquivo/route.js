import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { contaDaSessao } from '@/lib/auth';
import { acervo } from '@/lib/env';

export const runtime = 'edge';

// GET /api/portal/arquivo?k=<chave no R2>[&ver=1]  — ver=1 abre no navegador em vez de baixar.
export async function GET(req) {
  if (!(await contaDaSessao(cookies()))) {
    return NextResponse.json({ error: 'Faça login.' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const chave = searchParams.get('k') || '';
  if (!chave || chave.startsWith('_') || chave.includes('..')) {
    return NextResponse.json({ error: 'Arquivo inválido.' }, { status: 400 });
  }

  const bucket = acervo();
  const obj = bucket ? await bucket.get(chave) : null;
  if (!obj) return NextResponse.json({ error: 'Arquivo não encontrado.' }, { status: 404 });

  const nome = chave.split('/').pop();
  const modo = searchParams.get('ver') === '1' ? 'inline' : 'attachment';
  return new Response(obj.body, {
    headers: {
      'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
      'Content-Length': String(obj.size),
      'Content-Disposition': `${modo}; filename*=UTF-8''${encodeURIComponent(nome)}`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
