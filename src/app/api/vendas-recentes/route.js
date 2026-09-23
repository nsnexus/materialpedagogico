import { NextResponse } from 'next/server';
import { listarVendasRecentes } from '@/lib/vendas';

export const runtime = 'edge';

const SETE_DIAS = 7 * 24 * 60 * 60 * 1000;

export async function GET() {
  try {
    const limite = Date.now() - SETE_DIAS;
    const vendas = (await listarVendasRecentes()).filter((v) => v.nome && v.ts > limite);
    return NextResponse.json({ vendas }, { headers: { 'Cache-Control': 'public, max-age=60' } });
  } catch (err) {
    console.error('[GET /api/vendas-recentes]', err.message);
    return NextResponse.json({ vendas: [] });
  }
}
