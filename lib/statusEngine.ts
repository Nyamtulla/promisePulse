import { ReviewRound, Vote, PromiseRecord, TimelineEvent } from '@/models';
import { updateStatusOnChain, STATUS_MAP } from './blockchain';
import type { VoteOption } from '@/models';
import mongoose from 'mongoose';

export const VOTE_OPTIONS: VoteOption[] = [
  'NOT_VISIBLE',
  'IN_PROGRESS',
  'PARTIALLY_DONE',
  'DONE',
  'NOT_SURE',
];

const STATUS_FROM_VOTE: Record<VoteOption, string> = {
  NOT_VISIBLE: 'RECORDED',
  IN_PROGRESS: 'IN_PROGRESS',
  PARTIALLY_DONE: 'PARTIALLY_DONE',
  DONE: 'DONE',
  NOT_SURE: 'RECORDED',
};

const VOTE_ORDER: VoteOption[] = ['DONE', 'PARTIALLY_DONE', 'IN_PROGRESS', 'NOT_VISIBLE', 'NOT_SURE'];

export interface VoteDistribution {
  option: VoteOption;
  count: number;
  percentage: number;
}

export async function computeVoteDistribution(reviewRoundId: mongoose.Types.ObjectId): Promise<VoteDistribution[]> {
  const votes = await Vote.find({ reviewRoundId }).lean();
  const total = votes.length;
  const counts: Record<VoteOption, number> = {
    NOT_VISIBLE: 0,
    IN_PROGRESS: 0,
    PARTIALLY_DONE: 0,
    DONE: 0,
    NOT_SURE: 0,
  };
  for (const v of votes) {
    counts[v.selectedOption]++;
  }
  return VOTE_OPTIONS.map((opt) => ({
    option: opt,
    count: counts[opt],
    percentage: total > 0 ? Math.round((counts[opt] / total) * 1000) / 10 : 0,
  }));
}

export function computeFinalStatus(distribution: VoteDistribution[]): string {
  const statusVotes = distribution.filter((d) => d.option !== 'NOT_SURE');
  if (statusVotes.every((d) => d.count === 0)) return 'RECORDED';

  const byStatus: Record<string, number> = {};
  for (const d of statusVotes) {
    const status = STATUS_FROM_VOTE[d.option];
    byStatus[status] = (byStatus[status] || 0) + d.count;
  }

  const eligible = ['DONE', 'PARTIALLY_DONE', 'IN_PROGRESS', 'RECORDED'] as const;
  let winner: string = 'RECORDED';
  let maxCount = 0;
  for (const s of eligible) {
    const c = byStatus[s] || 0;
    if (c > maxCount) {
      maxCount = c;
      winner = s;
    }
  }
  return winner;
}

export async function closeReviewRound(reviewRoundId: mongoose.Types.ObjectId): Promise<void> {
  const round = await ReviewRound.findById(reviewRoundId).populate('promiseId');
  if (!round || round.status === 'CLOSED') return;

  const distribution = await computeVoteDistribution(reviewRoundId);
  const finalStatus = computeFinalStatus(distribution);

  const promise = await PromiseRecord.findById(round.promiseId);
  if (!promise) return;

  promise.status = finalStatus as 'RECORDED' | 'IN_PROGRESS' | 'PARTIALLY_DONE' | 'DONE';
  await promise.save();

  round.status = 'CLOSED';
  await round.save();

  const statusNum = STATUS_MAP[finalStatus] ?? 0;
  const txHash = await updateStatusOnChain(
    (promise as unknown as { onChainPromiseId: number }).onChainPromiseId ?? 0,
    statusNum
  );

  await TimelineEvent.create({
    promiseId: promise._id,
    eventType: 'STATUS_UPDATED',
    title: 'Status Updated',
    description: `Final status set to ${finalStatus} based on citizen votes.`,
    relatedReviewRoundId: reviewRoundId,
    txHash: txHash || undefined,
  });
}

export async function checkAndCloseExpiredRounds(): Promise<void> {
  const openRounds = await ReviewRound.find({
    status: 'OPEN',
    endTime: { $lte: new Date() },
  });
  for (const round of openRounds) {
    await closeReviewRound(round._id);
  }
}
