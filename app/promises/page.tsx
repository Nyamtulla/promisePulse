import { Suspense } from 'react';
import { Layout } from '@/components/Layout';
import { PromiseCard } from '@/components/PromiseCard';
import { PromisesFilters } from '@/components/PromisesFilters';

async function getPromises(searchParams: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  if (searchParams.category) params.set('category', searchParams.category);
  if (searchParams.region) params.set('region', searchParams.region);
  if (searchParams.status) params.set('status', searchParams.status);
  if (searchParams.triggered === 'true') params.set('triggered', 'true');
  if (searchParams.active === 'true') params.set('active', 'true');
  if (searchParams.reviewed === 'true') params.set('reviewed', 'true');
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/promises?${params}`,
    { cache: 'no-store' }
  );
  return res.json();
}

export default async function PromisesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const data = await getPromises(params);
  const promises = data.promises || [];

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-slate-900">
        Campaign Pledges
      </h1>
      <Suspense fallback={<div className="mt-4 h-10" />}>
        <PromisesFilters />
      </Suspense>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {promises.map((p: { id: string; promiseText: string; category: string; region: string; status: string }) => (
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
      {promises.length === 0 && (
        <p className="mt-8 text-center text-slate-500">
          No pledges found. Upload a file or fetch news to get started.
        </p>
      )}
    </Layout>
  );
}
