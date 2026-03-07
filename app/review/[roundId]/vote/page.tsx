import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { VoteForm } from '@/components/VoteForm';

async function getRound(roundId: string) {
  const roundsRes = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/review-rounds/open`,
    { cache: 'no-store' }
  );
  const { rounds } = await roundsRes.json();
  const round = rounds?.find(
    (r: { id: string }) => String(r.id) === String(roundId)
  );
  return round;
}

export default async function VotePage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const { roundId } = await params;
  const round = await getRound(roundId);
  if (!round) notFound();

  const promise = round.promise;
  const promiseText = typeof promise === 'object' && promise?.promiseText
    ? promise.promiseText
    : 'Unknown promise';

  const endTime = round.endTime ? new Date(round.endTime).toLocaleString() : null;

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        Vote on Promise Progress
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Has the promised change become visible in your community?
      </p>
      {endTime && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Voting ends: {endTime}
        </p>
      )}
      <Link
        href={`/review/${roundId}/results`}
        className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        View results
      </Link>
      <div className="mt-6 max-w-lg rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <VoteForm
          reviewRoundId={roundId}
          promiseText={promiseText}
        />
      </div>
    </Layout>
  );
}
