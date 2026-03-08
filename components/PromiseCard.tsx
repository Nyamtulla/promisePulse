import Link from 'next/link';
import { StatusBadge } from './StatusBadge';

interface PromiseCardProps {
  id: string;
  promiseText: string;
  category: string;
  region: string;
  status: string;
  evidenceCount?: number;
}

export function PromiseCard({
  id,
  promiseText,
  category,
  region,
  status,
  evidenceCount = 0,
}: PromiseCardProps) {
  return (
    <Link
      href={`/promises/${id}`}
      className="block rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/50"
    >
      <p className="line-clamp-2 text-slate-700">
        {promiseText}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={status} />
        {category && (
          <span className="text-xs text-slate-600">
            {category}
          </span>
        )}
        {region && (
          <span className="text-xs text-slate-600">
            {region}
          </span>
        )}
        {evidenceCount > 0 && (
          <span className="text-xs text-slate-600">
            {evidenceCount} evidence
          </span>
        )}
      </div>
    </Link>
  );
}
