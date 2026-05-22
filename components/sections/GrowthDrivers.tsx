import type { GrowthDrivers as T } from '@/lib/types';
import SectionReferences from '@/components/ui/SectionReferences';

const PEST_BADGE: Record<string, string> = {
  '정치': 'bg-red-100 text-red-700',
  '경제': 'bg-yellow-100 text-yellow-700',
  '사회': 'bg-green-100 text-green-700',
  '기술': 'bg-blue-100 text-blue-700',
};

function pestBadge(text: string) {
  for (const [key, cls] of Object.entries(PEST_BADGE)) {
    if (text.startsWith(key)) return { cls, label: key };
  }
  return { cls: 'bg-gray-100 text-gray-700', label: text.charAt(0) };
}

export default function GrowthDrivers({ data }: { data: T }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-3">🔍 성장 동인</h2>
      {data.summary && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 mb-4">
          <p className="text-sm font-medium text-amber-900 leading-snug">{data.summary}</p>
        </div>
      )}

      <div className="mb-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          PEST 거시환경
        </h3>
        <div className="space-y-2">
          {data.pest.map((item, i) => {
            const { cls, label } = pestBadge(item);
            const body = item.includes(':') ? item.split(':').slice(1).join(':').trim() : item;
            return (
              <div key={i} className="flex items-start gap-2">
                <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
                  {label}
                </span>
                <p className="text-sm text-gray-600">{body}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          소비자 미시환경
        </h3>
        <ul className="space-y-1.5">
          {data.consumer.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
        {data.description}
      </p>
      <SectionReferences refs={data.references} />
    </div>
  );
}
