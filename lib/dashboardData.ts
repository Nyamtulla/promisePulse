import { connectDB } from '@/lib/db';
import { PromiseRecord, ReviewRound, Vote } from '@/models';
import { checkAndCloseExpiredRounds } from '@/lib/statusEngine';

interface PromiseItem {
  id: string;
  promiseText: string;
  category: string;
  region: string;
  status: string;
}

interface Counts {
  total: number;
  underReview: number;
  reviewed: number;
  notFulfilled: number;
  pledgesVoted: number;
}

interface OpenRound {
  id: string;
  promise?: unknown;
  trigger?: unknown;
  startTime: Date;
  endTime: Date;
}

export interface DashboardData {
  promises: PromiseItem[];
  triggeredPromises: PromiseItem[];
  completedPromises: PromiseItem[];
  counts: Counts;
  openRounds: OpenRound[];
}

function mapPromise(p: Record<string, unknown>): PromiseItem {
  const rawId = p._id as { toString?: () => string } | string | undefined;
  const id = typeof rawId === 'string' ? rawId : rawId?.toString?.() ?? String(p._id);
  return {
    id,
    promiseText: p.promiseText as string,
    category: p.category as string,
    region: p.region as string,
    status: p.status as string,
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  await connectDB();
  await checkAndCloseExpiredRounds();

  const [promises, triggeredPromises, completedPromises, counts, openRounds] = await Promise.all([
    getRecordedPromises(),
    getActivePromises(),
    getReviewedPromises(),
    getCounts(),
    getOpenRounds(),
  ]);

  return {
    promises,
    triggeredPromises,
    completedPromises,
    counts,
    openRounds,
  };
}

async function getRecordedPromises(): Promise<PromiseItem[]> {
  const docs = await PromiseRecord.find({ status: 'RECORDED' })
    .sort({ createdAt: -1 })
    .select('promiseText category region status')
    .lean();
  return docs.map((p) => mapPromise(p as unknown as Record<string, unknown>));
}

async function getActivePromises(): Promise<PromiseItem[]> {
  const docs = await PromiseRecord.find({
    status: { $in: ['UNDER_REVIEW', 'IN_PROGRESS', 'PARTIALLY_DONE'] },
  })
    .sort({ createdAt: -1 })
    .select('promiseText category region status')
    .lean();
  return docs.map((p) => mapPromise(p as unknown as Record<string, unknown>));
}

async function getReviewedPromises(): Promise<PromiseItem[]> {
  const roundIdsWithVotes = await Vote.distinct('reviewRoundId');
  const reviewedPromiseIds = await ReviewRound.distinct('promiseId', {
    status: 'CLOSED',
    _id: { $in: roundIdsWithVotes },
  });
  const docs = await PromiseRecord.find({ _id: { $in: reviewedPromiseIds } })
    .sort({ createdAt: -1 })
    .select('promiseText category region status')
    .lean();
  return docs.map((p) => mapPromise(p as unknown as Record<string, unknown>));
}

async function getCounts(): Promise<Counts> {
  const roundIdsWithVotes = await Vote.distinct('reviewRoundId');
  const [pledgesVotedResult, reviewedResult, total, underReview, notFulfilled] = await Promise.all([
    ReviewRound.aggregate([
      { $match: { _id: { $in: roundIdsWithVotes } } },
      { $group: { _id: '$promiseId' } },
      { $count: 'total' },
    ]),
    ReviewRound.aggregate([
      { $match: { status: 'CLOSED', _id: { $in: roundIdsWithVotes } } },
      { $group: { _id: '$promiseId' } },
      { $count: 'total' },
    ]),
    PromiseRecord.countDocuments({}),
    PromiseRecord.countDocuments({ status: 'UNDER_REVIEW' }),
    PromiseRecord.countDocuments({
      status: { $in: ['RECORDED', 'IN_PROGRESS', 'PARTIALLY_DONE'] },
    }),
  ]);
  return {
    total,
    underReview,
    reviewed: reviewedResult[0]?.total ?? 0,
    notFulfilled,
    pledgesVoted: pledgesVotedResult[0]?.total ?? 0,
  };
}

async function getOpenRounds(): Promise<OpenRound[]> {
  const rounds = await ReviewRound.find({
    status: 'OPEN',
    endTime: { $gt: new Date() },
  })
    .populate('promiseId', 'promiseText category region status')
    .populate('triggerEventId', 'summary triggerType')
    .sort({ createdAt: -1 })
    .lean();

  return rounds.map((r) => {
    const doc = r as unknown as Record<string, unknown>;
    const id = (doc._id as { toString?: () => string })?.toString?.() ?? String(doc._id);
    return {
      id,
      promise: doc.promiseId,
      trigger: doc.triggerEventId,
      startTime: doc.startTime as Date,
      endTime: doc.endTime as Date,
    };
  });
}
