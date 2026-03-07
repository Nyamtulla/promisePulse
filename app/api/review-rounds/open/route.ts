import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ReviewRound } from '@/models';
import { checkAndCloseExpiredRounds } from '@/lib/statusEngine';

export async function GET() {
  try {
    await connectDB();
    await checkAndCloseExpiredRounds();

    const rounds = await ReviewRound.find({
      status: 'OPEN',
      endTime: { $gt: new Date() },
    })
      .populate('promiseId', 'promiseText category region status')
      .populate('triggerEventId', 'summary triggerType')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      rounds: rounds.map((r) => ({
        id: (r as { _id: { toString: () => string } })._id?.toString?.() ?? (r as { _id: unknown })._id,
        promise: (r as { promiseId: unknown }).promiseId,
        trigger: (r as { triggerEventId: unknown }).triggerEventId,
        startTime: (r as { startTime: Date }).startTime,
        endTime: (r as { endTime: Date }).endTime,
      })),
    });
  } catch (err) {
    console.error('GET /api/review-rounds/open error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
