'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { CompanyShare } from '@/lib/types';

interface Props {
  data: CompanyShare[];
}

// 점유율 높을수록 진한 파란색
function getColor(index: number, total: number) {
  const intensity = Math.round(255 - (index / total) * 160);
  return `rgb(37, ${99 + Math.round((index / total) * 80)}, ${intensity})`;
}

export default function CompanyShareChart({ data }: Props) {
  if (!data?.length) {
    return (
      <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
        기업 점유율 데이터 없음
      </div>
    );
  }

  // 점유율 높은 순 정렬 (기타는 항상 마지막)
  const sorted = [...data].sort((a, b) => {
    if (a.company === '기타') return 1;
    if (b.company === '기타') return -1;
    return b.share - a.share;
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={sorted}
        layout="vertical"
        margin={{ top: 4, right: 20, left: 0, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={v => `${v}%`}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="company"
          tick={{ fontSize: 11, fill: '#374151' }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <Tooltip
          formatter={(v: number) => [`${v}%`, '시장 점유율']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <Bar dataKey="share" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {sorted.map((_, i) => (
            <Cell key={i} fill={_.company === '기타' ? '#d1d5db' : getColor(i, sorted.length - 1)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
