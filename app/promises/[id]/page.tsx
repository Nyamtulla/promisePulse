import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { StatusBadge } from '@/components/StatusBadge';
import { Timeline } from '@/components/Timeline';

async function getPromise(id: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/promises/${id}`,
    { cache: 'no-store' }
  );
  if (!res.ok) return null;
  return res.json();
}

export default async function PromiseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getPromise(id);
  if (!data) notFound();

  const { promise, triggers, openReviewRound, timeline } = data;

  return (
    <Layout>
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {promise.promiseText}
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge status={promise.status} />
          {promise.category && (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {promise.category}
            </span>
          )}
          {promise.region && (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {promise.region}
            </span>
          )}
        </div>
        {promise.sourcePinataCid && (
          <a
            href={`https://ipfs.io/ipfs/${promise.sourcePinataCid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            View source artifact
          </a>
        )}

        {openReviewRound && (
          <Link
            href={`/review/${String(openReviewRound._id ?? openReviewRound.id)}/vote`}
            className="mt-4 inline-block rounded-lg bg-amber-500 px-4 py-2 font-medium text-white hover:bg-amber-600"
          >
            Vote in open review round
          </Link>
        )}
      </div>

      {triggers && triggers.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Evidence
          </h2>
          <ul className="mt-4 space-y-2">
            {triggers.map((t: { _id?: unknown; id?: string; summary: string; triggerType: string }, idx: number) => (
              <li
                key={t._id != null ? String(t._id) : t.id ?? `trigger-${idx}`}
                className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
              >
                <p className="text-slate-800 dark:text-slate-200">{t.summary}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.triggerType}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {timeline && timeline.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Timeline
          </h2>
          <div className="mt-4">
            <Timeline
              items={timeline.map((e: { _id: string; eventType: string; title: string; description?: string; createdAt: string; txHash?: string }) => ({
                id: e._id,
                eventType: e.eventType,
                title: e.title,
                description: e.description,
                createdAt: e.createdAt,
                txHash: e.txHash,
              }))}
            />
          </div>
        </div>
      )}
    </Layout>
  );
}
