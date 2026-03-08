import { connectDB } from '@/lib/db';
import { PromiseRecord, ReviewRound, Vote } from '@/models';

export interface PromiseItem {
  id: string;
  promiseText: string;
  category: string;
  region: string;
  status: string;
}

export interface PromisesWithFiltersResult {
  promises: PromiseItem[];
  total: number;
}

export async function getPromisesWithFilters(params: {
  category?: string;
  region?: string;
  status?: string;
  triggered?: boolean;
  reviewed?: boolean;
  active?: boolean;
  limit?: number;
  offset?: number;
}): Promise<PromisesWithFiltersResult> {
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (params.category) filter.category = params.category;
  if (params.region) filter.region = params.region;

  if (params.reviewed) {
    const roundIdsWithVotes = await Vote.distinct('reviewRoundId');
    const reviewedPromiseIds = await ReviewRound.distinct('promiseId', {
      status: 'CLOSED',
      _id: { $in: roundIdsWithVotes },
    });
    filter._id = { $in: reviewedPromiseIds };
  } else if (params.active) {
    filter.status = { $in: ['UNDER_REVIEW', 'IN_PROGRESS', 'PARTIALLY_DONE'] };
  } else if (params.triggered) {
    filter.status = { $in: ['UNDER_REVIEW', 'IN_PROGRESS', 'PARTIALLY_DONE', 'DONE'] };
  } else if (params.status) {
    filter.status = params.status;
  }

  const limit = Math.min(params.limit ?? 100, 200);
  const offset = params.offset ?? 0;

  const [docs, total] = await Promise.all([
    PromiseRecord.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .select('promiseText category region status')
      .lean(),
    PromiseRecord.countDocuments(filter),
  ]);

  const promises: PromiseItem[] = docs.map((p) => {
    const doc = p as unknown as Record<string, unknown>;
    const rawId = doc._id as { toString?: () => string } | string | undefined;
    const id = typeof rawId === 'string' ? rawId : rawId?.toString?.() ?? String(doc._id);
    return {
      id,
      promiseText: String(doc.promiseText ?? ''),
      category: String(doc.category ?? ''),
      region: String(doc.region ?? ''),
      status: String(doc.status ?? ''),
    };
  });

  return { promises, total };
}
