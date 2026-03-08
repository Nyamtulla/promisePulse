import { onPipelineProgress, type PipelineEvent } from '@/lib/pipelineEvents';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let keepAliveId: ReturnType<typeof setInterval> | null = null;
  let unsubscribe: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: PipelineEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // client disconnected
        }
      };

      unsubscribe = onPipelineProgress(send);

      keepAliveId = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          if (keepAliveId) clearInterval(keepAliveId);
        }
      }, 15000);

      request.signal.addEventListener('abort', () => {
        if (keepAliveId) clearInterval(keepAliveId);
        unsubscribe?.();
        controller.close();
      });
    },
    cancel() {
      if (keepAliveId) clearInterval(keepAliveId);
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
