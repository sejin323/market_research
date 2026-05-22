import { type NextRequest } from 'next/server';
import { getCachedReport, saveReport } from '@/lib/supabase';
import { searchTavily } from '@/lib/tavily';
import { searchPapers } from '@/lib/semantic-scholar';
import { getNaverTrends } from '@/lib/naver-datalab';
import { analyzeWithClaude } from '@/lib/claude';
import type { ProgressEvent } from '@/lib/types';

// Vercel Pro: 60초, Hobby: 10초 (분석이 오래 걸리면 Pro 플랜 필요)
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: ProgressEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        const body    = await req.json();
        const keyword = (body.keyword ?? '').trim() as string;
        const force   = body.force === true;

        if (!keyword) {
          send({ type: 'error', message: '키워드를 입력해주세요.' });
          controller.close();
          return;
        }

        // 1. 7일 캐시 확인 (force=true 면 건너뜀)
        if (!force) {
          send({ type: 'progress', step: 'cache', message: '캐시 확인 중...' });
          const cached = await getCachedReport(keyword);
          if (cached) {
            send({ type: 'done', reportId: cached.id, cached: true });
            controller.close();
            return;
          }
        } else {
          send({ type: 'progress', step: 'cache', message: '강제 재분석 — 캐시를 무시합니다.' });
        }

        // 2. 3개 소스 병렬 수집
        send({ type: 'progress', step: 'collecting', message: '뉴스·논문·트렌드 병렬 수집 중...' });
        const [tavilyResult, papersResult, naverResult] = await Promise.all([
          searchTavily(keyword),
          searchPapers(keyword),
          getNaverTrends(keyword),
        ]);

        // 3. Claude AI 분석
        send({ type: 'progress', step: 'analyzing', message: 'AI 시장 분석 중... (약 20-30초)' });
        const reportData = await analyzeWithClaude(keyword, tavilyResult, papersResult, naverResult.text);

        // Naver 실측 키워드 검색량을 차트 데이터에 주입
        if (reportData.charts) {
          reportData.charts.keywordTrend = naverResult.chartData;
        } else {
          reportData.charts = {
            marketSizeTrend: { data: [], unit: '' },
            marketSegments:  { tam: 0, sam: 0, som: 0, unit: '' },
            companyShares:   [],
            keywordTrend:    naverResult.chartData,
          };
        }

        // 수집된 전체 출처 주입 (Tavily + Scholar)
        reportData.sources = [
          ...tavilyResult.sources,
          ...papersResult.papers,
        ];

        // 4. Supabase 저장
        send({ type: 'progress', step: 'saving', message: '결과 저장 중...' });
        const reportId = await saveReport(keyword, reportData);

        // 5. 완료
        send({ type: 'done', reportId });
      } catch (e) {
        const message = e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.';
        send({ type: 'error', message });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  });
}
