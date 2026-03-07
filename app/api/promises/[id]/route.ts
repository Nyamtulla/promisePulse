import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { PromiseRecord, TriggerEvent, ReviewRound, TimelineEvent } from '@/models';
import mongoose from 'mongoose';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const promise = await PromiseRecord.findById(id)
      .populate('sourceArtifactId')
      .lean();
    if (!promise) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const triggers = await TriggerEvent.find({ promiseId: id })
      .populate('artifactId')
      .sort({ createdAt: -1 })
      .lean();

    const openRound = await ReviewRound.findOne({
      promiseId: id,
      status: 'OPEN',
    }).populate('triggerEventId').lean();

    const timeline = await TimelineEvent.find({ promiseId: id })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({
      promise: {
        id: (promise as { _id: { toString: () => string } })._id?.toString?.(),
        promiseText: (promise as { promiseText: string }).promiseText,
        category: (promise as { category: string }).category,
        region: (promise as { region: string }).region,
        status: (promise as { status: string }).status,
        sourceArtifact: (promise as { sourceArtifactId: unknown }).sourceArtifactId,
        sourcePinataCid: (promise as { sourcePinataCid: string }).sourcePinataCid,
        createdAt: (promise as { createdAt: Date }).createdAt,
      },
      triggers,
      openReviewRound: openRound,
      timeline,
    });
  } catch (err) {
    console.error('GET /api/promises/[id] error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
