import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Artifact } from '@/models';
import { processArtifact } from '@/lib/artifactProcessor';
import { join } from 'path';
import { rename } from 'fs/promises';

const ARTIFACTS_PATH = process.env.ARTIFACTS_PATH || './artifacts';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ artifactId: string }> }
) {
  try {
    const { artifactId } = await params;
    await connectDB();

    const artifact = await Artifact.findById(artifactId);
    if (!artifact) {
      return NextResponse.json({ error: 'Artifact not found' }, { status: 404 });
    }

    const base = join(process.cwd(), ARTIFACTS_PATH);
    const filename = artifact.filename;
    const incomingPath = join(base, 'incoming', filename);
    for (const dir of ['error', 'processed', 'unmatched']) {
      const src = join(base, dir, filename);
      try {
        await rename(src, incomingPath);
        break;
      } catch {
        // File not in this dir, try next
      }
    }

    artifact.processingStatus = 'PENDING';
    artifact.errorMessage = null;
    await artifact.save();

    const result = await processArtifact(incomingPath);

    return NextResponse.json(result);
  } catch (err) {
    console.error('POST /api/admin/reprocess error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
