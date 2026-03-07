import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { StatusBadge } from '@/components/StatusBadge';

async function getResults(roundId: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/review-rounds/${roundId}/results`,
    { cache: 'no-store' }
  );
  if (!res.ok) return null;
  return res.json();
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const { roundId } = await params;
  const data = await getResults(roundId);
  if (!data) notFound();

  const { round, distribution, finalStatus, totalVotes } = data;

  const promise = round?.promise;
  const promiseId = typeof promise === 'object' && promise?._id ? promise._id : null;

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        Review Round Results
      </h1>
      {promise && (
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {typeof promise === 'object' && promise.promiseText
            ? promise.promiseText
            : 'Promise'}
        </p>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {totalVotes}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total Votes
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Final Status
          </p>
          <StatusBadge status={finalStatus} />
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Vote Distribution
      </h2>
      <div className="mt-4 space-y-2">
        {distribution?.map((d: { option: string; count: number; percentage: number }) => (
          <div
            key={d.option}
            className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700"
          >
            <span className="font-medium">{d.option.replace(/_/g, ' ')}</span>
            <span>
              {d.count} votes ({d.percentage}%)
            </span>
          </div>
        ))}
      </div>

      {promiseId && (
        <Link
          href={`/promises/${promiseId}`}
          className="mt-6 inline-block text-blue-600 hover:underline dark:text-blue-400"
        >
          View promise detail
        </Link>
      )}
    </Layout>
  );
}
