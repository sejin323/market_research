import { type NextRequest, NextResponse } from 'next/server';
import { getReportById } from '@/lib/supabase';
import { createNotionReport } from '@/lib/notion';

export async function POST(req: NextRequest) {
  // 환경변수 검증
  if (!process.env.NOTION_API_KEY || !process.env.NOTION_PAGE_ID) {
    return NextResponse.json(
      { error: '.env.local에 NOTION_API_KEY와 NOTION_PAGE_ID를 설정해주세요.' },
      { status: 500 }
    );
  }

  let reportId: string;
  try {
    ({ reportId } = await req.json());
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const report = await getReportById(reportId);
  if (!report?.data) {
    return NextResponse.json({ error: '리포트를 찾을 수 없습니다.' }, { status: 404 });
  }

  const reportUrl = `${req.nextUrl.origin}/report/${reportId}`;

  try {
    const url = await createNotionReport(report.keyword, reportUrl, report.data);
    return NextResponse.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : '노션 저장 중 오류가 발생했습니다.';
    console.error('[Notion API error]', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
