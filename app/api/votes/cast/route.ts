import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Vote, ReviewRound } from '@/models';
import { z } from 'zod';

const schema = z.object({
  reviewRoundId: z.string(),
  voterId: z.string(),
  selectedOption: z.enum(['NOT_VISIBLE', 'IN_PROGRESS', 'PARTIALLY_DONE', 'DONE', 'NOT_SURE']),
  comment: z.string().optional(),
  proofCid: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error }, { status: 400 });
    }

    const { reviewRoundId, voterId, selectedOption, comment, proofCid } = parsed.data;

    await connectDB();

    const round = await ReviewRound.findById(reviewRoundId);
    if (!round) {
      return NextResponse.json({ error: 'Review round not found' }, { status: 404 });
    }
    if (round.status !== 'OPEN') {
      return NextResponse.json({ error: 'Review round is closed' }, { status: 400 });
    }
    if (new Date() > round.endTime) {
      return NextResponse.json({ error: 'Voting has ended' }, { status: 400 });
    }

    const existing = await Vote.findOne({ reviewRoundId, voterId });
    if (existing) {
      return NextResponse.json({ error: 'Already voted' }, { status: 400 });
    }

    const vote = await Vote.create({
      reviewRoundId,
      voterId,
      selectedOption,
      comment: comment || null,
      proofCid: proofCid || null,
    });

    return NextResponse.json({
      id: vote.id,
      reviewRoundId,
      selectedOption,
    });
  } catch (err) {
    console.error('POST /api/votes/cast error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
