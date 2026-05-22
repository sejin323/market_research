import { TrendingUp, TrendingDown } from 'lucide-react';
import type { GrowthRate as T } from '@/lib/types';
import SectionReferences from '@/components/ui/SectionReferences';

// 분야별 성장 기준표 (항상 표시)
const INDUSTRY_TABLE = [
  { industry: 'AI/반도체/우주항공',      ultraHigh: '30%↑', high: '20~30%', stable: '10~20%', low: '10%↓' },
  { industry: '바이오/헬스케어/의료기기', ultraHigh: '15%↑', high: '8~15%',  stable: '4~8%',  low: '4%↓'  },
  { industry: '전기차/신재생에너지',      ultraHigh: '25%↑', high: '15~25%', stable: '8~15%', low: '8%↓'  },
  { industry: '클라우드/SaaS/플랫폼',    ultraHigh: '25%↑', high: '15~25%', stable: '8~15%', low: '8%↓'  },
  { industry: '소비재/유통/식품',         ultraHigh: '15%↑', high: '7~15%',  stable: '3~7%',  low: '3%↓'  },
  { industry: '전통제조/철강/화학',       ultraHigh: '10%↑', high: '5~10%',  stable: '2~5%',  low: '2%↓'  },
  { industry: '금융/보험',               ultraHigh: '12%↑', high: '6~12%',  stable: '3~6%',  low: '3%↓'  },
  { industry: '기타(판단불가)',           ultraHigh: '20%↑', high: '10~20%', stable: '5~10%', low: '5%↓'  },
];

const CATEGORY_STYLE: Record<string, string> = {
  초고성장: 'bg-purple-100 text-purple-800 border-purple-200',
  고성장:   'bg-green-100  text-green-800  border-green-200',
  안정성장: 'bg-blue-100   text-blue-800   border-blue-200',
  저성장:   'bg-gray-100   text-gray-700   border-gray-200',
};

export default function GrowthRate({ data }: { data: T }) {
  const cat      = data.growthCategory;
  const catStyle = cat ? (CATEGORY_STYLE[cat] ?? 'bg-gray-100 text-gray-700 border-gray-200') : null;

  const icon = (() => {
    if (cat === '초고성장' || cat === '고성장')  return <TrendingUp  className="w-7 h-7 text-green-600" />;
    if (cat === '저성장')                        return <TrendingDown className="w-7 h-7 text-gray-400" />;
    if (data.isHighGrowth)                       return <TrendingUp  className="w-7 h-7 text-green-600" />;
    return <TrendingDown className="w-7 h-7 text-gray-400" />;
  })();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-3">📈 시장 성장률</h2>

      {/* 요약 callout */}
      {data.summary && (
        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 mb-4">
          <p className="text-sm font-medium text-green-900 leading-snug">{data.summary}</p>
        </div>
      )}

      {/* CAGR 배지 */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`flex items-center gap-3 px-5 py-3 rounded-xl ${data.isHighGrowth ? 'bg-green-50' : 'bg-gray-50'}`}>
          {icon}
          <div>
            <p className="text-2xl font-bold text-gray-900">{data.cagr}</p>
            <p className="text-xs text-gray-500">연평균 성장률 (CAGR)</p>
          </div>
        </div>
        {catStyle && cat && (
          <span className={`px-3 py-1.5 text-sm font-semibold rounded-full border ${catStyle}`}>
            {cat === '초고성장' ? '🚀' : cat === '고성장' ? '✓' : cat === '안정성장' ? '→' : '↓'} {cat}
          </span>
        )}
      </div>

      {/* 분야 기반 판단 메시지 */}
      {data.industry && data.growthCategory && (
        <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4 text-sm text-gray-700 leading-relaxed">
          이 시장의 CAGR은{' '}
          <strong className="text-gray-900">
            {data.cagrValue != null ? `${data.cagrValue}%` : data.cagr}
          </strong>
          입니다.{' '}
          <strong className="text-gray-900">[{data.industry}]</strong> 시장 기준
          {data.growthThreshold && (
            <span className="text-blue-700 font-medium">
              ({data.growthCategory} 기준: {data.growthThreshold} 범위)
            </span>
          )}
          을 적용하여{' '}
          <span className={`font-bold ${catStyle ? catStyle.split(' ')[1] : 'text-gray-900'}`}>
            [{data.growthCategory}]
          </span>{' '}
          시장으로 판단했습니다.
          <br />
          <span className="text-xs text-gray-500">단, 분야 판단이 다를 경우 아래 기준표를 참고하세요.</span>
        </div>
      )}

      {/* 분야별 기준표 */}
      <div className="mb-4">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">분야별 고성장 기준표</p>
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                <th className="text-left px-3 py-2 font-semibold border-b border-gray-100 min-w-[130px]">분야</th>
                <th className="px-2 py-2 font-semibold border-b border-gray-100 text-purple-600">초고성장</th>
                <th className="px-2 py-2 font-semibold border-b border-gray-100 text-green-600">고성장</th>
                <th className="px-2 py-2 font-semibold border-b border-gray-100 text-blue-600">안정성장</th>
                <th className="px-2 py-2 font-semibold border-b border-gray-100 text-gray-500">저성장</th>
              </tr>
            </thead>
            <tbody>
              {INDUSTRY_TABLE.map((row) => {
                const isMatch = data.industry === row.industry;
                return (
                  <tr
                    key={row.industry}
                    className={isMatch ? 'bg-blue-50 font-semibold' : 'hover:bg-gray-50'}
                  >
                    <td className={`px-3 py-1.5 border-b border-gray-50 ${isMatch ? 'text-blue-700' : 'text-gray-700'}`}>
                      {isMatch && <span className="mr-1">▶</span>}{row.industry}
                    </td>
                    <td className="px-2 py-1.5 text-center border-b border-gray-50 text-purple-700">{row.ultraHigh}</td>
                    <td className="px-2 py-1.5 text-center border-b border-gray-50 text-green-700">{row.high}</td>
                    <td className="px-2 py-1.5 text-center border-b border-gray-50 text-blue-700">{row.stable}</td>
                    <td className="px-2 py-1.5 text-center border-b border-gray-50 text-gray-500">{row.low}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed">{data.description}</p>
      <SectionReferences refs={data.references} />
    </div>
  );
}
