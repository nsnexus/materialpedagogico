import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { contaDaSessao } from '@/lib/auth';
import { acervo } from '@/lib/env';

export const runtime = 'edge';

// Catálogo gerado pelo scripts/subir-acervo.mjs: { geradoEm, arquivos: [{ k: chave, t: bytes }] }
export async function GET() {
  if (!(await contaDaSessao(cookies()))) {
    return NextResponse.json({ error: 'Faça login.' }, { status: 401 });
  }
  const bucket = acervo();
  const obj = bucket ? await bucket.get('_catalogo.json') : null;
  if (!obj) return NextResponse.json({ geradoEm: null, arquivos: [] });

  return new Response(obj.body, {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, max-age=300' },
  });
}
