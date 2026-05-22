import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

type Size = 'sm' | 'md' | 'lg';

export default function LoadingSpinner({ size = 'md', className }: { size?: Size; className?: string }) {
  const sz: Record<Size, string> = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return <Loader2 className={clsx('animate-spin text-blue-500', sz[size], className)} />;
}
