'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const CATEGORIES = ['roads', 'drainage', 'streetlights', 'water', 'sanitation', 'public works'];
const STATUSES = ['RECORDED', 'UNDER_REVIEW', 'IN_PROGRESS', 'PARTIALLY_DONE', 'DONE'];

export function PromisesFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get('category') ?? '';
  const status = searchParams.get('status') ?? '';
  const active = searchParams.get('active') === 'true';
  const reviewed = searchParams.get('reviewed') === 'true';

  function update(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === 'active') next.delete('status');
    if (key === 'status') next.delete('active');
    router.push(next.toString() ? `/promises?${next}` : '/promises');
  }

  function updateStatusFilter(value: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.delete('status');
    next.delete('active');
    next.delete('reviewed');
    if (value === '__ACTIVE__') next.set('active', 'true');
    else if (value === '__REVIEWED__') next.set('reviewed', 'true');
    else if (value) next.set('status', value);
    router.push(next.toString() ? `/promises?${next}` : '/promises');
  }

  const statusValue = active ? '__ACTIVE__' : reviewed ? '__REVIEWED__' : status;

  return (
    <div className="mt-4 flex flex-wrap gap-4">
      <select
        value={category}
        onChange={(e) => update('category', e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
      >
        <option value="">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        value={statusValue}
        onChange={(e) => updateStatusFilter(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
      >
        <option value="">All statuses</option>
        <option value="__ACTIVE__">Active (in progress)</option>
        <option value="__REVIEWED__">Reviewed</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, ' ')}
          </option>
        ))}
      </select>
    </div>
  );
}
