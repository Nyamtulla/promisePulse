'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const CATEGORIES = ['roads', 'drainage', 'streetlights', 'water', 'sanitation', 'public works'];
const STATUSES = ['RECORDED', 'UNDER_REVIEW', 'IN_PROGRESS', 'PARTIALLY_DONE', 'DONE'];

export function PromisesFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get('category') ?? '';
  const status = searchParams.get('status') ?? '';

  function update(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/promises?${next}`);
  }

  return (
    <div className="mt-4 flex flex-wrap gap-4">
      <select
        value={category}
        onChange={(e) => update('category', e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      >
        <option value="">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        value={status}
        onChange={(e) => update('status', e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, ' ')}
          </option>
        ))}
      </select>
    </div>
  );
}
