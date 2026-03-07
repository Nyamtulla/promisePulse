import { Layout } from '@/components/Layout';
import { PromiseCard } from '@/components/PromiseCard';
import Link from 'next/link';

async function getData() {
  const [promisesRes, roundsRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/promises`, {
      cache: 'no-store',
    }),
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/review-rounds/open`, {
      cache: 'no-store',
    }),
  ]);
  const promisesData = await promisesRes.json();
  const roundsData = await roundsRes.json();
  return {
    promises: promisesData.promises || [],
    total: promisesData.total || 0,
    openRounds: roundsData.rounds || [],
  };
}

export default async function DashboardPage() {
  const { promises, total, openRounds } = await getData();

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        Dashboard
      </h1>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {total}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total Promises
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {openRounds.length}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Active Review Rounds
          </p>
          {openRounds.length > 0 && (
            <Link
              href={`/review/${openRounds[0].id}/vote`}
              className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              Vote now →
            </Link>
          )}
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Latest Promises
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {promises.slice(0, 6).map((p: { id: string; promiseText: string; category: string; region: string; status: string }) => (
          <PromiseCard
            key={p.id}
            id={p.id}
            promiseText={p.promiseText}
            category={p.category}
            region={p.region}
            status={p.status}
          />
        ))}
      </div>
      {promises.length > 0 && (
        <Link
          href="/promises"
          className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          View all promises →
        </Link>
      )}
    </Layout>
  );
}
