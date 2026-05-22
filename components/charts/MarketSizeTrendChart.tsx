'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { YearlyDataPoint } from '@/lib/types';

interface Props {
  data: YearlyDataPoint[];
  unit: string;
}

const currentYear = new Date().getFullYear().toString();

export default function MarketSizeTrendChart({ data, unit }: Props) {
  if (!data?.length) return <EmptyChart label="시장 규모 데이터 없음" />;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis
          dataKey="year"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => v.toLocaleString()}
          width={55}
        />
        <Tooltip
          formatter={(v: number) => [`${v.toLocaleString()} ${unit}`, '시장 규모']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        {/* 현재 연도 구분선 */}
        <ReferenceLine
          x={currentYear}
          stroke="#d1d5db"
          strokeDasharray="4 4"
          label={{ value: '현재', position: 'top', fontSize: 10, fill: '#9ca3af' }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#3b82f6"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
      {label}
    </div>
  );
}
