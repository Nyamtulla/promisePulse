'use client';

import { useState, useCallback } from 'react';
import { FileUp, Loader2 } from 'lucide-react';

const ACCEPT = '.txt,.md,.pdf';
const ACCEPT_TYPES = ['text/plain', 'text/markdown', 'application/pdf'];

export function ArtifactUpload() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File) => {
    setError(null);
    setSuccess(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload-artifact', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        for (const chunk of lines) {
          if (!chunk.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(chunk.slice(6));
            if (data.stage) {
              window.dispatchEvent(
                new CustomEvent('pipeline-event', { detail: data })
              );
            }
            if (data.done) {
              setSuccess(data.filename || 'File processed');
              setTimeout(() => setSuccess(null), 5000);
            }
            if (data.error && !data.done) {
              setError(data.error);
            }
          } catch {
            // skip parse errors
          }
        }
      }

      if (buffer.startsWith('data: ')) {
        try {
          const data = JSON.parse(buffer.slice(6));
          if (data.stage) {
            window.dispatchEvent(new CustomEvent('pipeline-event', { detail: data }));
          }
          if (data.done) {
            setSuccess(data.filename || 'File processed');
            setTimeout(() => setSuccess(null), 5000);
          }
          if (data.error && !data.done) setError(data.error);
        } catch {
          // skip parse errors
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
      if (!['.txt', '.md', '.pdf'].includes(ext)) {
        setError('Only .txt, .md, and .pdf files are supported');
        return;
      }
      uploadFile(file);
    },
    [uploadFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      e.target.value = '';
    },
    [uploadFile]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative flex w-full min-h-[72px] items-center justify-center rounded-lg border-2 border-dashed p-3 text-center transition-colors ${
        dragging
          ? 'border-teal-400 bg-teal-50/50'
          : 'border-slate-200/80 bg-slate-50/80'
      }`}
    >
      <input
        type="file"
        accept={ACCEPT}
        onChange={handleChange}
        disabled={uploading}
        className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
          <p className="text-xs font-medium text-slate-700">Processing…</p>
        </div>
      ) : (
        <>
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-200/80 text-slate-600">
            <FileUp className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-800">
            Upload document or select file
          </p>
          <p className="text-xs text-slate-600">.txt, .md, .pdf</p>
        </>
      )}
      {error && (
        <p className="mt-2 text-xs text-red-700">{error}</p>
      )}
      {success && (
        <p className="mt-2 text-xs font-medium text-teal-700">
          ✓ {success} processed
        </p>
      )}
    </div>
  );
}
