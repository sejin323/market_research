import type { MarketSize as T } from '@/lib/types';
import SectionReferences from '@/components/ui/SectionReferences';

export default function MarketSize({ data }: { data: T }) {
  const items = [
    { key: 'TAM', sub: '전체 시장', value: data.tam,  bg: 'bg-blue-50',   badge: 'bg-blue-100 text-blue-700' },
    { key: 'SAM', sub: '서비스 가능', value: data.sam, bg: 'bg-indigo-50', badge: 'bg-indigo-100 text-indigo-700' },
    { key: 'SOM', sub: '획득 가능',   value: data.som, bg: 'bg-violet-50', badge: 'bg-violet-100 text-violet-700' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-3">📊 시장 규모</h2>
      {data.summary && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 mb-4">
          <p className="text-sm font-medium text-blue-900 leading-snug">{data.summary}</p>
        </div>
      )}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {items.map(({ key, sub, value, bg, badge }) => (
          <div key={key} className={`${bg} rounded-xl p-4 text-center`}>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${badge} mb-2`}>
              {key}
            </span>
            <p className="text-xs text-gray-500 mb-1">{sub}</p>
            <p className="text-sm font-semibold text-gray-900 leading-tight">{value}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
        {data.description}
      </p>
      <SectionReferences refs={data.references} />
    </div>
  );
}
