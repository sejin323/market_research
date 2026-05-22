import SearchForm from '@/components/SearchForm';

// searchParams: ?q= 값을 서버에서 읽어 SearchForm에 props로 전달
// (useSearchParams 클라이언트 훅 불필요 → Suspense 불필요)
export default function Home({
  searchParams,
}: {
  searchParams: { q?: string; force?: string };
}) {
  return (
    <div className="min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          AI 시장조사 리포트
        </h1>
        <p className="text-base text-gray-500 max-w-xl">
          키워드를 입력하면 뉴스·논문·트렌드를 자동 수집하고
          Claude AI가 시장 분석 리포트를 생성합니다
        </p>
      </div>

      <SearchForm
        initialKeyword={searchParams.q ?? ''}
        initialForce={searchParams.force === 'true'}
      />

      <div className="mt-12 grid grid-cols-3 gap-4 text-center w-full max-w-xl">
        {[
          { icon: '📰', label: '뉴스 & 기업', sub: 'Tavily 실시간 검색' },
          { icon: '📚', label: '학술 논문', sub: 'Semantic Scholar' },
          { icon: '📈', label: '국내 트렌드', sub: '네이버 데이터랩' },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl mb-1">{item.icon}</div>
            <div className="text-sm font-medium text-gray-900">{item.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{item.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
