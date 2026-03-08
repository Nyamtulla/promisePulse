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

    const p = promise as {
      _id: { toString: () => string };
      promiseText: string;
      category: string;
      region: string;
      status: string;
      sourceArtifactId: unknown;
      sourcePinataCid: string;
      createdAt: Date;
      onChainTxHash?: string | null;
      onChainPromiseId?: number | null;
    };

    return NextResponse.json({
      promise: {
        id: p._id?.toString?.(),
        promiseText: p.promiseText,
        category: p.category,
        region: p.region,
        status: p.status,
        sourceArtifact: p.sourceArtifactId,
        sourcePinataCid: p.sourcePinataCid,
        createdAt: p.createdAt,
        onChainTxHash: p.onChainTxHash || null,
        onChainPromiseId: p.onChainPromiseId ?? null,
      },
      triggers,
      openReviewRound: openRound,
      timeline,
      blockchain: {
        contractAddress: process.env.CONTRACT_ADDRESS || null,
        explorerUrl: 'https://amoy.polygonscan.com',
      },
    });
  } catch (err) {
    console.error('GET /api/promises/[id] error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
