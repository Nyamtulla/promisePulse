import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ReviewRound, Vote } from '@/models';
import { computeVoteDistribution, computeFinalStatus } from '@/lib/statusEngine';
import mongoose from 'mongoose';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const round = await ReviewRound.findById(id)
      .populate('promiseId')
      .populate('triggerEventId')
      .lean();
    if (!round) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const distribution = await computeVoteDistribution(id as unknown as mongoose.Types.ObjectId);
    const finalStatus = computeFinalStatus(distribution);

    const votes = await Vote.find({ reviewRoundId: id }).lean();

    return NextResponse.json({
      round: {
        id: (round as { _id: unknown })._id,
        promise: (round as { promiseId: unknown }).promiseId,
        trigger: (round as { triggerEventId: unknown }).triggerEventId,
        status: (round as { status: string }).status,
        endTime: (round as { endTime: Date }).endTime,
      },
      distribution,
      finalStatus,
      totalVotes: votes.length,
    });
  } catch (err) {
    console.error('GET /api/review-rounds/[id]/results error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
