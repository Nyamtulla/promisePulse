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
      <h1 className="text-2xl font-bold text-slate-900">
        Review Round Results
      </h1>
      {promise && (
        <p className="mt-2 text-slate-600">
          {typeof promise === 'object' && promise.promiseText
            ? promise.promiseText
            : 'Pledge'}
        </p>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-3xl font-bold text-slate-900">
            {totalVotes}
          </p>
          <p className="text-sm text-slate-500">
            Total Votes
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Final Status
          </p>
          <StatusBadge status={finalStatus} />
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">
        Vote Distribution
      </h2>
      <div className="mt-4 space-y-2">
        {distribution?.map((d: { option: string; count: number; percentage: number }) => (
          <div
            key={d.option}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
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
          className="mt-6 inline-block text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
        >
          View pledge detail
        </Link>
      )}
    </Layout>
  );
}
