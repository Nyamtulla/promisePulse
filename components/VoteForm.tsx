'use client';

import { useState } from 'react';

const OPTIONS = [
  { value: 'NOT_VISIBLE', label: 'Not Visible' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'PARTIALLY_DONE', label: 'Partially Done' },
  { value: 'DONE', label: 'Done' },
  { value: 'NOT_SURE', label: 'Not Sure' },
] as const;

interface VoteFormProps {
  reviewRoundId: string;
  promiseText: string;
  onSuccess?: () => void;
}

export function VoteForm({ reviewRoundId, promiseText, onSuccess }: VoteFormProps) {
  const [selected, setSelected] = useState<string>('');
  const [voterId, setVoterId] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !voterId.trim()) {
      setError('Please select an option and enter your wallet address');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/votes/cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewRoundId,
          voterId: voterId.trim(),
          selectedOption: selected,
          comment: comment.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cast vote');
      }
      setDone(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg bg-teal-50/80 p-4">
        <p className="font-medium text-teal-800">
          Vote recorded successfully.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-slate-600">{promiseText}</p>
      <div>
        <label className="mb-2 block text-sm font-medium">Your wallet address (voter ID)</label>
        <input
          type="text"
          value={voterId}
          onChange={(e) => setVoterId(e.target.value)}
          placeholder="0x..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium">Vote</label>
        <div className="space-y-2">
          {OPTIONS.map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="vote"
                value={opt.value}
                checked={selected === opt.value}
                onChange={() => setSelected(opt.value)}
                className="h-4 w-4"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium">Comment (optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-50 hover:bg-slate-800"
      >
        {loading ? 'Submitting...' : 'Submit Vote'}
      </button>
    </form>
  );
}
