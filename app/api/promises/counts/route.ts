import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { PromiseRecord, ReviewRound, Vote } from '@/models';

export async function GET() {
  try {
    await connectDB();
    const roundIdsWithVotes = await Vote.distinct('reviewRoundId');
    const pledgesVotedResult = await ReviewRound.aggregate([
      { $match: { _id: { $in: roundIdsWithVotes } } },
      { $group: { _id: '$promiseId' } },
      { $count: 'total' },
    ]);
    const pledgesVoted = pledgesVotedResult[0]?.total ?? 0;

    const reviewedResult = await ReviewRound.aggregate([
      { $match: { status: 'CLOSED', _id: { $in: roundIdsWithVotes } } },
      { $group: { _id: '$promiseId' } },
      { $count: 'total' },
    ]);
    const reviewed = reviewedResult[0]?.total ?? 0;

    const [total, underReview, notFulfilled] = await Promise.all([
      PromiseRecord.countDocuments({}),
      PromiseRecord.countDocuments({ status: 'UNDER_REVIEW' }),
      PromiseRecord.countDocuments({
        status: { $in: ['RECORDED', 'IN_PROGRESS', 'PARTIALLY_DONE'] },
      }),
    ]);
    return NextResponse.json({
      total,
      underReview,
      reviewed,
      notFulfilled,
      pledgesVoted,
    });
  } catch (err) {
    console.error('GET /api/promises/counts error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
