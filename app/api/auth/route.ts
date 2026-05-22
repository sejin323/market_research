import { type NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { password } = (await req.json()) as { password?: string };

  const appPw = process.env.APP_PASSWORD;
  console.log('[Auth] APP_PASSWORD 설정:', appPw ? `설정됨 (${appPw.length}자)` : '❌ 미설정');

  if (!appPw) {
    return NextResponse.json({ error: 'APP_PASSWORD 환경변수가 설정되지 않았습니다.' }, { status: 500 });
  }

  if (!password || password !== appPw) {
    console.log('[Auth] ❌ 비밀번호 불일치');
    return NextResponse.json({ error: '비밀번호가 틀렸습니다.' }, { status: 401 });
  }

  console.log('[Auth] ✅ 인증 성공 → 쿠키 발급');

  const res = NextResponse.json({ ok: true });
  res.cookies.set('app_auth', 'ok', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7일
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('app_auth');
  return res;
}
