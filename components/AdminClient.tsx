'use client';

import { useState } from 'react';
import { ArtifactTable } from './ArtifactTable';

interface Artifact {
  id: string;
  filename: string;
  classification: string | null;
  processingStatus: string;
  pinataCid: string | null;
  matchedPromise: { promiseText: string; status: string } | null;
  errorMessage: string | null;
  createdAt: string;
}

export function AdminClient({ artifacts: initial }: { artifacts: Artifact[] }) {
  const [artifacts, setArtifacts] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleRetry(id: string) {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/reprocess/${id}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setArtifacts((prev) =>
          prev.map((a) =>
            a.id === id
              ? { ...a, processingStatus: data.error ? 'ERROR' : 'PROCESSED', errorMessage: data.error }
              : a
          )
        );
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-6">
      <ArtifactTable
        artifacts={artifacts.map((a) => ({
          ...a,
          id: a.id,
        }))}
        onRetry={handleRetry}
      />
    </div>
  );
}
