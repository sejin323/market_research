import type { NaverTrendResult, KeywordDataPoint } from './types';

interface NaverDataPoint {
  period: string;
  ratio: number;
}

export async function getNaverTrends(keyword: string): Promise<NaverTrendResult> {
  const clientId     = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  // ── 환경변수 존재 여부 로깅 (값은 출력하지 않음) ──
  console.log('[NaverDataLab] 환경변수 확인:', {
    NAVER_CLIENT_ID:     clientId     ? `설정됨 (${clientId.length}자)` : '❌ 미설정',
    NAVER_CLIENT_SECRET: clientSecret ? `설정됨 (${clientSecret.length}자)` : '❌ 미설정',
    keyword,
  });

  const empty: NaverTrendResult = {
    text: '네이버 트렌드 데이터를 가져올 수 없습니다. (NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 미설정)',
    chartData: [],
  };

  if (!clientId || !clientSecret) {
    console.error('[NaverDataLab] ❌ 환경변수 미설정으로 조기 반환');
    return empty;
  }

  const now        = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const startDate = fmt(oneYearAgo);
  const endDate   = fmt(now);
  const timeUnit  = 'month';

  const requestBody = {
    startDate,
    endDate,
    timeUnit,
    keywordGroups: [{ groupName: keyword, keywords: [keyword] }],
  };

  // ── 요청 파라미터 전체 로깅 ──
  console.log('[NaverDataLab] 요청 파라미터:', JSON.stringify(requestBody, null, 2));

  try {
    console.log('[NaverDataLab] fetch 시작 → https://openapi.naver.com/v1/datalab/search');
    const res = await fetch('https://openapi.naver.com/v1/datalab/search', {
      method: 'POST',
      headers: {
        'Content-Type':          'application/json',
        'X-Naver-Client-Id':     clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[NaverDataLab] 응답 HTTP 상태:', res.status, res.statusText);

    if (!res.ok) {
      const body = await res.text().catch(() => '(body 읽기 실패)');
      console.error('[NaverDataLab] ❌ 오류 응답 body:', body);
      return {
        text: `네이버 트렌드 수집 실패 (HTTP ${res.status} ${res.statusText}: ${body.slice(0, 300)})`,
        chartData: [],
      };
    }

    const json = await res.json();
    console.log('[NaverDataLab] 응답 JSON (raw):', JSON.stringify(json, null, 2));

    const dataPoints: NaverDataPoint[] = json.results?.[0]?.data ?? [];
    console.log('[NaverDataLab] 파싱된 데이터포인트 수:', dataPoints.length);

    if (dataPoints.length === 0) {
      console.warn('[NaverDataLab] ⚠️ 데이터포인트 0개 — results 구조:', JSON.stringify(json.results, null, 2));
      return { text: '네이버 트렌드 데이터 없음', chartData: [] };
    }

    // 차트용 데이터
    const chartData: KeywordDataPoint[] = dataPoints.map(d => ({
      period: d.period.slice(0, 7),  // "2024-05-01" → "2024-05"
      ratio:  Math.round(d.ratio * 10) / 10,
    }));

    const values    = dataPoints.map(d => d.ratio);
    const recentAvg = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const prevAvg   = values.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(values.length - 3, 1);
    const changePct = prevAvg > 0 ? ((recentAvg / prevAvg - 1) * 100).toFixed(1) : 'N/A';
    const trend     = recentAvg > prevAvg * 1.1 ? '상승 추세' : recentAvg < prevAvg * 0.9 ? '하락 추세' : '안정적';
    const monthly   = chartData.map(d => `${d.period}: ${d.ratio}`).join(' | ');

    console.log('[NaverDataLab] ✅ 성공:', { trend, changePct, dataCount: chartData.length });

    const text = [
      `키워드: "${keyword}"`,
      `월별 검색량 추이 (최근 12개월): ${monthly}`,
      `전반적 트렌드: ${trend}`,
      `최근 3개월 평균: ${recentAvg.toFixed(1)} (이전 대비 ${changePct}% 변화)`,
    ].join('\n');

    return { text, chartData };
  } catch (e) {
    console.error('[NaverDataLab] ❌ 예외 발생:', e);
    return {
      text: `네이버 트렌드 수집 오류: ${e instanceof Error ? e.message : '알 수 없는 오류'}`,
      chartData: [],
    };
  }
}
