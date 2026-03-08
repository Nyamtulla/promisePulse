import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { processArtifact } from '@/lib/artifactProcessor';
import { isSupportedFile } from '@/lib/artifactReader';
import type { PipelineEvent } from '@/lib/pipelineEvents';

const ARTIFACTS_PATH = process.env.ARTIFACTS_PATH || './artifacts';
const UPLOAD_DIR = 'uploaded';

// On Vercel/serverless, /var/task is read-only. Use /tmp for uploads.
function getUploadDir(): string {
  if (process.env.VERCEL) {
    return join('/tmp', 'artifact-uploads');
  }
  return join(process.cwd(), ARTIFACTS_PATH, UPLOAD_DIR);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const originalName = file.name;
    if (!isSupportedFile(originalName)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Use .txt, .md, or .pdf' },
        { status: 400 }
      );
    }

    const ext = originalName.split('.').pop() || '';
    const baseName = originalName.replace(/\.[^.]+$/, '').slice(0, 50) || 'artifact';
    const uniqueName = `${baseName}-${Date.now()}.${ext}`;
    const uploadDir = getUploadDir();
    const filePath = join(uploadDir, uniqueName);

    await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } catch {
            // client disconnected
          }
        };

        try {
          const result = await processArtifact(filePath, {
            onEvent: (e: PipelineEvent) =>
              send({ ...e, filename: originalName }),
          });

          if (result.error) {
            send({ error: result.error, artifactId: result.artifactId });
            controller.close();
            return;
          }

          send({
            done: true,
            artifactId: result.artifactId,
            filename: originalName,
            message: 'Artifact processed successfully',
          });
        } catch (err) {
          console.error('Upload artifact error:', err);
          send({
            error: err instanceof Error ? err.message : 'Upload failed',
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Upload artifact error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
