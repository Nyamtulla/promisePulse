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
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
    >
      <p className="line-clamp-2 text-slate-800 dark:text-slate-100">
        {promiseText}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={status} />
        {category && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {category}
          </span>
        )}
        {region && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {region}
          </span>
        )}
        {evidenceCount > 0 && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {evidenceCount} evidence
          </span>
        )}
      </div>
    </Link>
  );
}
