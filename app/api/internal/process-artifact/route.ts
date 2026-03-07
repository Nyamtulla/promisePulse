import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { processArtifact } from '@/lib/artifactProcessor';
import { z } from 'zod';

const schema = z.object({
  filePath: z.string().optional(),
  filename: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { filePath, filename } = parsed.data;
    let input = filePath || filename;
    if (!input) {
      return NextResponse.json({ error: 'filePath or filename required' }, { status: 400 });
    }

    await connectDB();
    const result = await processArtifact(input);
    return NextResponse.json(result);
  } catch (err) {
    console.error('process-artifact error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
