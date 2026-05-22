import Link from 'next/link';
import type { RelatedKeyword } from '@/lib/types';

export default function RelatedKeywords({ data }: { data: RelatedKeyword[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">🔗 연관 키워드 부록</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.map((item, i) => (
          <Link
            key={i}
            href={`/?q=${encodeURIComponent(item.keyword)}`}
            className="group block bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-3.5 transition-colors"
          >
            <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors mb-1">
              {item.keyword}
            </p>
            <p className="text-xs text-gray-500">{item.reason}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
