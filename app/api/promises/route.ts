import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { PromiseRecord, ReviewRound, Vote } from '@/models';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const region = searchParams.get('region');
    const status = searchParams.get('status');
    const triggered = searchParams.get('triggered') === 'true';
    const reviewed = searchParams.get('reviewed') === 'true';

    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (region) filter.region = region;

    if (reviewed) {
      const roundIdsWithVotes = await Vote.distinct('reviewRoundId');
      const reviewedPromiseIds = await ReviewRound.distinct('promiseId', {
        status: 'CLOSED',
        _id: { $in: roundIdsWithVotes },
      });
      filter._id = { $in: reviewedPromiseIds };
    } else {
      const active = searchParams.get('active') === 'true';
      if (active) {
        filter.status = { $in: ['UNDER_REVIEW', 'IN_PROGRESS', 'PARTIALLY_DONE'] };
      } else if (triggered) {
        filter.status = { $in: ['UNDER_REVIEW', 'IN_PROGRESS', 'PARTIALLY_DONE', 'DONE'] };
      } else if (status) {
        filter.status = status;
      }
    }

    const promises = await PromiseRecord.find(filter)
      .sort({ createdAt: -1 })
      .populate('sourceArtifactId', 'filename pinataCid')
      .lean();

    const count = await PromiseRecord.countDocuments(filter);

    return NextResponse.json({
      promises: promises.map((p) => ({
        id: (p as { _id: unknown })._id,
        promiseText: (p as { promiseText: string }).promiseText,
        category: (p as { category: string }).category,
        region: (p as { region: string }).region,
        status: (p as { status: string }).status,
        createdAt: (p as { createdAt: Date }).createdAt,
        sourceArtifact: (p as { sourceArtifactId: unknown }).sourceArtifactId,
      })),
      total: count,
    });
  } catch (err) {
    console.error('GET /api/promises error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
