'use client';

import type { MarketSegmentData } from '@/lib/types';

export default function MarketSegmentChart({ data }: { data: MarketSegmentData | undefined }) {
  if (!data?.tam) {
    return (
      <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
        시장 세분화 데이터 없음
      </div>
    );
  }

  const { tam, sam, som, unit } = data;

  const fmt = (n: number) => n.toLocaleString();
  const pct = (n: number) => ((n / tam) * 100).toFixed(1) + '%';

  // Radii proportional to area (√(value/tam)), min enforced
  const MAX_R = 80;
  const SAM_R = Math.max(MAX_R * Math.sqrt(sam / tam), 28);
  const SOM_R = Math.max(MAX_R * Math.sqrt(som / tam), 14);
  const CX = 90, CY = 90;

  const tamRingMid = (MAX_R + SAM_R) / 2;
  const samRingMid = (SAM_R + SOM_R) / 2;
  const tamRingW   = MAX_R - SAM_R;
  const samRingW   = SAM_R - SOM_R;

  return (
    <div className="px-1 pt-1">
      <div className="text-center mb-2">
        <span className="text-xs text-gray-500">TAM 전체</span>
        <span className="ml-2 text-sm font-bold text-blue-700">{fmt(tam)} {unit}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* SVG concentric circles — NO Recharts */}
        <svg
          viewBox="0 0 180 180"
          className="w-[155px] h-[155px] shrink-0"
          aria-label="TAM/SAM/SOM 동심원 차트"
        >
          {/* TAM outer circle */}
          <circle cx={CX} cy={CY} r={MAX_R}
            fill="rgba(219,234,254,0.55)"
            stroke="#3b82f6" strokeWidth="2"
          />
          {/* SAM middle circle */}
          <circle cx={CX} cy={CY} r={SAM_R}
            fill="rgba(96,165,250,0.55)"
            stroke="#2563eb" strokeWidth="2"
          />
          {/* SOM inner circle */}
          <circle cx={CX} cy={CY} r={SOM_R}
            fill="rgba(29,78,216,0.88)"
            stroke="#1d4ed8" strokeWidth="1.5"
          />

          {/* TAM ring label */}
          {tamRingW >= 18 && (
            <text x={CX} y={CY - tamRingMid + 4}
              textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1e40af">
              TAM
            </text>
          )}
          {tamRingW >= 30 && (
            <text x={CX} y={CY - tamRingMid + 15}
              textAnchor="middle" fontSize="9" fill="#3b82f6">
              {pct(tam)}
            </text>
          )}

          {/* SAM ring label */}
          {samRingW >= 12 && (
            <text x={CX} y={CY - samRingMid + 4}
              textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1e3a8a">
              SAM
            </text>
          )}
          {samRingW >= 24 && (
            <text x={CX} y={CY - samRingMid + 14}
              textAnchor="middle" fontSize="8" fill="#1e3a8a">
              {pct(sam)}
            </text>
          )}

          {/* SOM center label */}
          <text x={CX} y={CY + (SOM_R >= 18 ? 3 : 4)}
            textAnchor="middle"
            fontSize={SOM_R >= 16 ? '9' : '8'}
            fontWeight="bold" fill="white">
            SOM
          </text>
          {SOM_R >= 22 && (
            <text x={CX} y={CY + 13}
              textAnchor="middle" fontSize="8" fill="rgba(219,234,254,0.9)">
              {pct(som)}
            </text>
          )}
        </svg>

        {/* Legend */}
        <div className="flex-1 space-y-3 py-1">
          {(
            [
              { abbr: 'TAM', name: '전체시장', eng: 'Total Addressable Market',    value: tam, dotCls: 'bg-blue-200 border border-blue-400' },
              { abbr: 'SAM', name: '유효시장', eng: 'Service Available Market',    value: sam, dotCls: 'bg-blue-400' },
              { abbr: 'SOM', name: '수익시장', eng: 'Service Obtainable Market',   value: som, dotCls: 'bg-blue-700' },
            ] as const
          ).map(({ abbr, name, eng, value, dotCls }) => (
            <div key={abbr} className="text-[11px]">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotCls}`} />
                <span className="font-bold text-gray-800">{abbr}</span>
                <span className="text-gray-600 font-medium">{name}</span>
              </div>
              <p className="text-[9px] text-gray-400 pl-4 leading-tight truncate">{eng}</p>
              <p className="text-xs font-semibold text-gray-800 pl-4">
                {fmt(value)}{' '}
                <span className="font-normal text-gray-500">{unit}</span>
                <span className="text-gray-400 font-normal ml-1">({pct(value)})</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
