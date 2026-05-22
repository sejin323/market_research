'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Copy, Check, Clock, RefreshCw, Loader2, ExternalLink, BookOpen, Trash2 } from 'lucide-react';
import type { Report } from '@/lib/types';
import MarketSize      from './sections/MarketSize';
import GrowthRate      from './sections/GrowthRate';
import GrowthDrivers   from './sections/GrowthDrivers';
import RiskSection     from './sections/RiskSection';
import Trends          from './sections/Trends';
import RelatedKeywords from './sections/RelatedKeywords';
import ChartsOverview  from './sections/ChartsOverview';

type NotionStatus     = 'idle' | 'loading' | 'done' | 'error';
type CacheDelStatus   = 'idle' | 'loading' | 'done' | 'error';

export default function ReportView({ report }: { report: Report }) {
  const router = useRouter();

  const [copied, setCopied]                 = useState(false);
  const [notionStatus, setNotionStatus]     = useState<NotionStatus>('idle');
  const [notionUrl, setNotionUrl]           = useState('');
  const [notionError, setNotionError]       = useState('');
  const [cacheDelStatus, setCacheDelStatus] = useState<CacheDelStatus>('idle');
  const data = report.data!;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNotion = async () => {
    if (notionStatus === 'loading') return;
    setNotionStatus('loading');
    setNotionError('');

    try {
      const res  = await fetch('/api/notion', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ reportId: report.id }),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? '저장 실패');

      setNotionUrl(json.url);
      setNotionStatus('done');
    } catch (e) {
      setNotionError(e instanceof Error ? e.message : '노션 저장 실패');
      setNotionStatus('error');
    }
  };

  const handleCacheDelete = async () => {
    if (cacheDelStatus === 'loading') return;
    setCacheDelStatus('loading');
    try {
      const res = await fetch('/api/cache', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ keyword: report.keyword }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? '삭제 실패');
      }
      setCacheDelStatus('done');
      // 1초 후 강제 재분析 페이지로 이동
      setTimeout(() => {
        router.push(`/?q=${encodeURIComponent(report.keyword)}&force=true`);
      }, 1000);
    } catch (e) {
      console.error('[CacheDelete]', e);
      setCacheDelStatus('error');
      setTimeout(() => setCacheDelStatus('idle'), 3000);
    }
  };

  const createdAt = new Date(report.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="max-w-3xl mx-auto">
      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          새 분석
        </Link>

        <div className="flex items-center gap-2">
          {/* 캐시 삭제 버튼 (Supabase 삭제 후 강제 재분석으로 이동) */}
          <button
            onClick={handleCacheDelete}
            disabled={cacheDelStatus === 'loading' || cacheDelStatus === 'done'}
            title="Supabase 캐시 삭제 후 강제 재분석"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {cacheDelStatus === 'loading'
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : cacheDelStatus === 'done'
              ? <Check className="w-4 h-4 text-green-600" />
              : <Trash2 className="w-4 h-4" />}
            {cacheDelStatus === 'done'
              ? '삭제됨 — 이동 중'
              : cacheDelStatus === 'error'
              ? '삭제 실패'
              : '캐시 삭제'}
          </button>

          {/* 강제 재분석 버튼 (캐시는 유지, force=true로 분석) */}
          <Link
            href={`/?q=${encodeURIComponent(report.keyword)}&force=true`}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-orange-200 text-orange-600 rounded-lg text-sm hover:bg-orange-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            강제 재분석
          </Link>

          {/* 노션에 저장 버튼 */}
          <NotionButton
            status={notionStatus}
            url={notionUrl}
            onClick={handleNotion}
          />

          {/* 팀 공유 링크 */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            {copied
              ? <><Check className="w-4 h-4 text-green-500" />복사됨</>
              : <><Copy className="w-4 h-4" />팀 공유 링크</>
            }
          </button>
        </div>
      </div>

      {/* 노션 에러 메시지 */}
      {notionStatus === 'error' && notionError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          노션 저장 실패: {notionError}
        </div>
      )}

      {/* 타이틀 카드 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 mb-5 text-white">
        <p className="text-blue-200 text-sm mb-1">AI 시장 조사 리포트</p>
        <h1 className="text-3xl font-bold mb-3">"{report.keyword}" 시장 분석</h1>
        <div className="flex items-center gap-1.5 text-blue-200 text-sm">
          <Clock className="w-4 h-4" />
          {createdAt} · 7일간 캐시 유지
        </div>
      </div>

      {/* 차트 섹션 */}
      {data.charts ? (
        <div className="mb-4">
          <ChartsOverview charts={data.charts} keyword={report.keyword} />
        </div>
      ) : (
        <div className="mb-4 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4">
          <RefreshCw className="w-4 h-4 text-gray-400 shrink-0" />
          <p className="text-sm text-gray-500">이 리포트는 차트 기능 추가 전에 생성되었습니다.</p>
          <Link
            href={`/?q=${encodeURIComponent(report.keyword)}&force=true`}
            className="ml-auto shrink-0 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            재분석
          </Link>
        </div>
      )}

      {/* 텍스트 섹션 */}
      <div className="space-y-4">
        <MarketSize data={data.marketSize} />
        <GrowthRate data={data.growthRate} />
        <GrowthDrivers data={data.growthDrivers} />
        {data.marketRisk && <RiskSection data={data.marketRisk} />}
        <Trends data={data.trends} />
        <RelatedKeywords data={data.relatedKeywords} />

        {/* 수집 출처 전체 목록 */}
        {data.sources && data.sources.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-gray-500" />
              <h2 className="text-base font-semibold text-gray-900">참고문헌</h2>
              <span className="ml-auto text-xs text-gray-400">{data.sources.length}건</span>
            </div>
            <ol className="space-y-2.5">
              {data.sources.map((src, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] flex items-center justify-center font-semibold mt-0.5">
                    {i + 1}
                  </span>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors group"
                  >
                    <span className="leading-snug">{src.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-50 group-hover:opacity-100" />
                  </a>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 노션 버튼 상태 컴포넌트 ─────────────────────────────────────────
function NotionButton({
  status,
  url,
  onClick,
}: {
  status:  NotionStatus;
  url:     string;
  onClick: () => void;
}) {
  // 저장 완료 → 노션 페이지 열기 링크로 전환
  if (status === 'done' && url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 hover:bg-green-100 transition-colors"
      >
        <Check className="w-4 h-4" />
        노션에서 열기
        <ExternalLink className="w-3 h-3" />
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={status === 'loading'}
      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      {status === 'loading' ? (
        <><Loader2 className="w-4 h-4 animate-spin" />저장 중...</>
      ) : status === 'error' ? (
        <><NotionIcon />재시도</>
      ) : (
        <><NotionIcon />노션에 저장</>
      )}
    </button>
  );
}

// Notion 로고 (SVG)
function NotionIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
    </svg>
  );
}
