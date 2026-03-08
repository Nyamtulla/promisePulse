'use client';

import Link from 'next/link';
import { PromiseCard } from './PromiseCard';
import { LocationSelector } from './LocationSelector';

interface PromiseItem {
  id: string;
  promiseText: string;
  category: string;
  region: string;
  status: string;
}

interface DashboardPanelProps {
  promises: PromiseItem[];
  triggeredPromises: PromiseItem[];
  completedPromises: PromiseItem[];
  counts: {
    total: number;
    underReview: number;
    reviewed: number;
    notFulfilled: number;
    pledgesVoted: number;
  };
  activeRounds: number;
  firstRoundId?: string;
}

export function DashboardPanel({
  promises,
  triggeredPromises,
  completedPromises,
  counts,
  activeRounds,
  firstRoundId,
}: DashboardPanelProps) {
  return (
    <div className="flex flex-1 flex-col border-slate-200/80 bg-transparent lg:border-l lg:pl-8">
      {/* KPI boxes + Location */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-sm shadow-slate-200/50">
              <p className="text-xl font-bold text-slate-800">{counts.total}</p>
              <p className="text-xs text-slate-600">Total pledges</p>
            </div>
            <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-sm shadow-slate-200/50">
              <p className="text-xl font-bold text-slate-800">{counts.underReview}</p>
              <p className="text-xs text-slate-600">Under review</p>
            </div>
            <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-sm shadow-slate-200/50">
              <p className="text-xl font-bold text-slate-800">{counts.notFulfilled}</p>
              <p className="text-xs text-slate-600">Not fulfilled</p>
            </div>
            <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-sm shadow-slate-200/50">
              <p className="text-xl font-bold text-slate-800">{counts.reviewed}</p>
              <p className="text-xs text-slate-600">Reviewed</p>
            </div>
            <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-sm shadow-slate-200/50">
              <p className="text-xl font-bold text-slate-800">{counts.pledgesVoted}</p>
              <p className="text-xs text-slate-600">Pledges voted</p>
            </div>
            <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-sm shadow-slate-200/50">
              <p className="text-xl font-bold text-slate-800">{activeRounds}</p>
              <p className="text-xs text-slate-600">Active rounds</p>
              {firstRoundId && (
                <Link
                  href={`/review/${firstRoundId}/vote`}
                  className="mt-0.5 block text-xs font-medium text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
                >
                  Vote now →
                </Link>
              )}
            </div>
          </div>
        <LocationSelector />
      </div>

      <div className="mt-8 flex flex-1 gap-4">
        <div className="flex-1 rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50">
            <h3 className="font-display mb-3 text-sm font-semibold tracking-tight text-slate-800">
            Pledges
          </h3>
          <div className="max-h-[420px] space-y-3 overflow-y-auto">
            {promises.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-600">
                No pledges yet. Upload a document to get started.
              </p>
            ) : (
              promises.slice(0, 10).map((p) => (
                <PromiseCard
                  key={p.id}
                  id={p.id}
                  promiseText={p.promiseText}
                  category={p.category}
                  region={p.region}
                  status={p.status}
                />
              ))
            )}
          </div>
          {promises.length > 0 && (
            <Link
              href="/promises?status=RECORDED"
              className="mt-3 block text-center text-xs font-medium text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
            >
              View all pledges →
            </Link>
          )}
        </div>

        <div className="flex-1 rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50">
            <h3 className="font-display mb-3 text-sm font-semibold tracking-tight text-slate-800">
            Active Pledges
          </h3>
          <div className="max-h-[420px] space-y-3 overflow-y-auto">
            {triggeredPromises.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-600">
                No active pledges. Upload an update to trigger a review.
              </p>
            ) : (
              triggeredPromises.slice(0, 10).map((p) => (
                <PromiseCard
                  key={p.id}
                  id={p.id}
                  promiseText={p.promiseText}
                  category={p.category}
                  region={p.region}
                  status={p.status}
                />
              ))
            )}
          </div>
          {triggeredPromises.length > 0 && (
            <Link
              href="/promises?active=true"
              className="mt-3 block text-center text-xs font-medium text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
            >
              View all pledges →
            </Link>
          )}
        </div>

        <div className="flex-1 rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50">
          <h3 className="font-display mb-3 text-sm font-semibold tracking-tight text-slate-800">
          Reviewed
        </h3>
          <div className="max-h-[420px] space-y-3 overflow-y-auto">
            {completedPromises.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-600">
                No reviewed pledges yet.
              </p>
            ) : (
              completedPromises.slice(0, 10).map((p) => (
                <PromiseCard
                  key={p.id}
                  id={p.id}
                  promiseText={p.promiseText}
                  category={p.category}
                  region={p.region}
                  status={p.status}
                />
              ))
            )}
          </div>
          {completedPromises.length > 0 && (
            <Link
              href="/promises?reviewed=true"
              className="mt-3 block text-center text-xs font-medium text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
            >
              View all pledges →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
