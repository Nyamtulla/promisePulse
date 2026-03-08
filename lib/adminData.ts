import { connectDB } from '@/lib/db';
import { Artifact } from '@/models';

export interface AdminArtifact {
  id: string;
  filename: string;
  classification: string | null;
  processingStatus: string;
  pinataCid: string | null;
  matchedPromise: { promiseText: string; status: string } | null;
  errorMessage: string | null;
  createdAt: string;
}

export async function getAdminArtifacts(opts?: {
  limit?: number;
  offset?: number;
}): Promise<{ artifacts: AdminArtifact[]; total: number }> {
  await connectDB();

  const limit = Math.min(opts?.limit ?? 50, 100);
  const offset = opts?.offset ?? 0;

  const [artifacts, total] = await Promise.all([
    Artifact.find()
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate('matchedPromiseId', 'promiseText status')
      .lean(),
    Artifact.countDocuments(),
  ]);

  const plainArtifacts: AdminArtifact[] = artifacts.map((a) => {
    const doc = a as unknown as Record<string, unknown>;
    const rawId = doc._id as { toString?: () => string } | string | undefined;
    const id = typeof rawId === 'string' ? rawId : rawId?.toString?.() ?? String(doc._id);

    const matched = doc.matchedPromiseId as Record<string, unknown> | null | undefined;
    const matchedPromise = matched
      ? {
          promiseText: String(matched.promiseText ?? ''),
          status: String(matched.status ?? ''),
        }
      : null;

    const createdAt = doc.createdAt as Date;
    return {
      id,
      filename: String(doc.filename ?? ''),
      classification: (doc.classification as string) ?? null,
      processingStatus: String(doc.processingStatus ?? 'PENDING'),
      pinataCid: (doc.pinataCid as string) ?? null,
      matchedPromise,
      errorMessage: (doc.errorMessage as string) ?? null,
      createdAt: createdAt ? new Date(createdAt).toISOString() : '',
    };
  });

  return { artifacts: plainArtifacts, total };
}
