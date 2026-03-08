'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ResetPledgesButton({ className = '' }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  async function handleReset() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reset-pledges', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setConfirming(false);
        router.refresh();
      } else {
        alert(data.error || 'Failed to reset pledges');
      }
    } catch (err) {
      alert('Failed to reset pledges');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      {confirming ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">
            Are you sure? This will delete all pledges, votes, and review data.
          </span>
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Deleting…' : 'Yes, delete all'}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
        >
          Reset all pledges
        </button>
      )}
    </div>
  );
}
