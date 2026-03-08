import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import {
  PromiseRecord,
  TriggerEvent,
  ReviewRound,
  Vote,
  TimelineEvent,
  Artifact,
} from '@/models';

export async function POST() {
  try {
    await connectDB();

    const [votesDeleted, roundsDeleted, timelineDeleted, triggersDeleted, promisesDeleted] =
      await Promise.all([
        Vote.deleteMany({}),
        ReviewRound.deleteMany({}),
        TimelineEvent.deleteMany({}),
        TriggerEvent.deleteMany({}),
        PromiseRecord.deleteMany({}),
      ]);

    await Artifact.updateMany(
      { matchedPromiseId: { $ne: null } },
      { $set: { matchedPromiseId: null } }
    );

    return NextResponse.json({
      ok: true,
      deleted: {
        votes: votesDeleted.deletedCount,
        reviewRounds: roundsDeleted.deletedCount,
        timelineEvents: timelineDeleted.deletedCount,
        triggers: triggersDeleted.deletedCount,
        promises: promisesDeleted.deletedCount,
      },
    });
  } catch (err) {
    console.error('POST /api/admin/reset-pledges error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
