import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 정적 자산 및 공개 경로 통과
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const auth = req.cookies.get('app_auth')?.value;
  console.log(`[Auth] ${pathname} | cookie=${auth ?? 'none'}`);

  if (auth === 'ok') return NextResponse.next();

  console.log(`[Auth] → /login 리다이렉트`);
  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
};
