'use client';

import dynamic from 'next/dynamic';
import type { ChartData } from '@/lib/types';

// ssr: false — Recharts가 window/ResizeObserver 등 브라우저 API에 의존하므로
// SSR에서 실행되면 조용히 실패함. 클라이언트 전용으로 강제 로드.
const MarketSizeTrendChart = dynamic(
  () => import('@/components/charts/MarketSizeTrendChart'),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const MarketSegmentChart = dynamic(
  () => import('@/components/charts/MarketSegmentChart'),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const CompanyShareChart = dynamic(
  () => import('@/components/charts/CompanyShareChart'),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const KeywordTrendChart = dynamic(
  () => import('@/components/charts/KeywordTrendChart'),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

function ChartSkeleton() {
  return (
    <div className="h-[220px] rounded-xl bg-gray-50 animate-pulse flex items-center justify-center">
      <span className="text-xs text-gray-400">차트 로딩 중...</span>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

interface Props {
  charts: ChartData;
  keyword: string;
}

export default function ChartsOverview({ charts, keyword }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <ChartCard
        title="📈 시장 규모 연도별 추이"
        subtitle={`단위: ${charts.marketSizeTrend?.unit || '—'} · 점선 이후 예측`}
      >
        <MarketSizeTrendChart
          data={charts.marketSizeTrend?.data ?? []}
          unit={charts.marketSizeTrend?.unit ?? ''}
        />
      </ChartCard>

      <ChartCard
        title="🎯 TAM / SAM / SOM"
        subtitle={`단위: ${charts.marketSegments?.unit || '—'} · 원 크기 = 시장 규모 비례`}
      >
        <MarketSegmentChart data={charts.marketSegments} />
      </ChartCard>

      <ChartCard
        title="🏆 기업별 시장 점유율"
        subtitle="추정치 기준 · 출처: 뉴스·리서치 데이터"
      >
        <CompanyShareChart data={charts.companyShares ?? []} />
      </ChartCard>

      <ChartCard
        title="🔍 키워드 검색량 추이"
        subtitle="출처: 네이버 데이터랩 실측 · 12개월"
      >
        <KeywordTrendChart data={charts.keywordTrend ?? []} keyword={keyword} />
      </ChartCard>
    </div>
  );
}
