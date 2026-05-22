import { ExternalLink } from 'lucide-react';
import type { Trends as T } from '@/lib/types';
import SectionReferences from '@/components/ui/SectionReferences';

export default function Trends({ data }: { data: T }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">🏢 기업 & 논문 동향</h2>

      <div className="mb-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          기업 및 이슈
        </h3>
        <ul className="space-y-2">
          {data.companies.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
              <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-semibold">
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {data.papers.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            학술 동향
          </h3>
          <div className="space-y-2">
            {data.papers.map((p, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3">
                {p.url ? (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-1 text-xs font-semibold text-blue-700 hover:underline mb-0.5 group"
                  >
                    <span className="line-clamp-2">{p.title}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 opacity-60 group-hover:opacity-100" />
                  </a>
                ) : (
                  <p className="text-xs font-semibold text-gray-800 mb-0.5">{p.title}</p>
                )}
                <p className="text-xs text-gray-500">{p.insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
        {data.description}
      </p>

      <SectionReferences refs={data.references} label="뉴스 출처" />
    </div>
  );
}
