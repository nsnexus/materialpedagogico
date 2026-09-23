import { NextResponse } from 'next/server';
import { COOKIE_ADMIN } from '@/lib/auth';

export const runtime = 'edge';

export async function POST(req) {
  const res = NextResponse.redirect(new URL('/admin', req.url), 303);
  res.cookies.delete(COOKIE_ADMIN);
  return res;
}
