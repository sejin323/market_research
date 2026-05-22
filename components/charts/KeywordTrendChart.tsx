'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import type { KeywordDataPoint } from '@/lib/types';

interface Props {
  data: KeywordDataPoint[];
  keyword: string;
}

export default function KeywordTrendChart({ data, keyword }: Props) {
  if (!data?.length) {
    const googleTrendsUrl =
      `https://trends.google.com/trends/explore?q=${encodeURIComponent(keyword)}&geo=KR`;
    return (
      <div className="h-[220px] flex flex-col items-center justify-center gap-3 px-4">
        <div className="w-full rounded-xl bg-gray-50 border border-gray-200 px-5 py-4 text-center">
          <p className="text-sm font-medium text-gray-700 mb-1">
            해당 키워드는 네이버 검색량 데이터가 부족합니다
          </p>
          <p className="text-xs text-gray-400 leading-relaxed">
            네이버 데이터랩은 검색량이 일정 수준 이상인 키워드만 제공합니다.
            전문 용어·영문 키워드·신조어 등은 데이터가 없을 수 있습니다.
          </p>
        </div>
        <a
          href={googleTrendsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          Google Trends에서 "{keyword}" 검색하기
          <svg className="w-3.5 h-3.5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 10 }}>
        <defs>
          <linearGradient id="keywordGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis
          dataKey="period"
          tick={{ fontSize: 10, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
          interval={0}
          angle={-35}
          textAnchor="end"
          height={38}
          tickFormatter={(v: string) => {
            const [y, m] = v.split('-');
            const mo = parseInt(m ?? '0');
            // 1월에는 연도 표시 ('24.1), 나머지는 월만 (2월 … 12월)
            return mo === 1 ? `'${(y ?? '').slice(2)}.1` : `${mo}월`;
          }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <Tooltip
          formatter={(v: number) => [`${v.toFixed(1)}`, '검색량 지수 (100 기준)']}
          labelFormatter={(label: string) => `${label}`}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <Area
          type="monotone"
          dataKey="ratio"
          stroke="#10b981"
          strokeWidth={2.5}
          fill="url(#keywordGrad)"
          dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          name={`"${keyword}" 검색량`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
