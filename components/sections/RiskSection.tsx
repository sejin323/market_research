import type { MarketRisk, RiskItem } from '@/lib/types';

const LEVEL = {
  high:   { dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700 border-red-200',       label: '고위험' },
  medium: { dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-200', label: '중위험' },
  low:    { dot: 'bg-gray-400',   badge: 'bg-gray-50 text-gray-600 border-gray-200',    label: '저위험' },
};

const BOXES: { key: keyof Pick<MarketRisk, 'technical' | 'business' | 'regulatory'>; icon: string; title: string }[] = [
  { key: 'technical',  icon: '⚙️', title: '기술적 리스크'   },
  { key: 'business',   icon: '💼', title: '사업적 리스크'   },
  { key: 'regulatory', icon: '⚖️', title: '규제/정책 리스크' },
];

function RiskCard({ icon, title, items }: { icon: string; title: string; items: RiskItem[] }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
        <span>{icon}</span>
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400">해당 없음</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item, i) => {
            const lvl = LEVEL[item.level] ?? LEVEL.low;
            return (
              <li key={i} className="flex items-start gap-2">
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${lvl.dot}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="text-xs font-semibold text-gray-800">{item.title}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${lvl.badge}`}>
                      {lvl.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-snug">{item.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function RiskSection({ data }: { data: MarketRisk }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-3">⚠️ 시장 리스크 분석</h2>

      {data.summary && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 mb-4">
          <p className="text-sm font-medium text-amber-900 leading-snug">{data.summary}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {BOXES.map(({ key, icon, title }) => (
          <RiskCard key={key} icon={icon} title={title} items={data[key] ?? []} />
        ))}
      </div>
    </div>
  );
}
