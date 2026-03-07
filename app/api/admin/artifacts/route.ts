import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Artifact } from '@/models';

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const artifacts = await Artifact.find()
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate('matchedPromiseId', 'promiseText status')
      .lean();

    const total = await Artifact.countDocuments();

    return NextResponse.json({
      artifacts: artifacts.map((a) => ({
        id: (a as { _id: unknown })._id,
        filename: (a as { filename: string }).filename,
        classification: (a as { classification: string }).classification,
        processingStatus: (a as { processingStatus: string }).processingStatus,
        pinataCid: (a as { pinataCid: string }).pinataCid,
        matchedPromise: (a as { matchedPromiseId: unknown }).matchedPromiseId,
        errorMessage: (a as { errorMessage: string }).errorMessage,
        createdAt: (a as { createdAt: Date }).createdAt,
      })),
      total,
    });
  } catch (err) {
    console.error('GET /api/admin/artifacts error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
