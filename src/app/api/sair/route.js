import { NextResponse } from 'next/server';
import { COOKIE_SESSAO } from '@/lib/auth';

export const runtime = 'edge';

export async function POST(req) {
  const res = NextResponse.redirect(new URL('/entrar', req.url), 303);
  res.cookies.delete(COOKIE_SESSAO);
  return res;
}
