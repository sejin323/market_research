import { ExternalLink } from 'lucide-react';
import type { Reference } from '@/lib/types';

interface Props {
  refs?: Reference[];
  label?: string;
}

export default function SectionReferences({ refs, label = '출처' }: Props) {
  if (!refs?.length) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
        {label}
      </p>
      <ul className="space-y-1.5">
        {refs.map((ref, i) => (
          <li key={i}>
            <a
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-1.5 text-xs text-blue-500 hover:text-blue-700 hover:underline transition-colors group"
            >
              <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <span className="line-clamp-2 leading-snug">{ref.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
