'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const LOCATIONS = [
  'Lawrence, KS',
  'Kansas City',
  'Douglas County',
  'Topeka',
  'Wichita',
  'Other',
];

export function LocationNewsFetch() {
  const [selected, setSelected] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const location = selected === 'Other' ? customLocation.trim() : selected;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!location) return;
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch('/api/fetch-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMessage(data.message || `Processed ${data.processed} articles.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <label className="mb-2 block text-sm font-medium text-slate-700">Location</label>
      <div className="flex flex-wrap gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={loading}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white disabled:opacity-60"
        >
          <option value="">Select…</option>
          {LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
        {selected === 'Other' ? (
          <input
            type="text"
            value={customLocation}
            onChange={(e) => setCustomLocation(e.target.value)}
            placeholder="Enter location"
            disabled={loading}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-60"
          />
        ) : null}
        <button
          type="submit"
          disabled={loading || !location}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? '…' : 'Fetch'}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {message && <p className="mt-2 text-xs text-teal-700">{message}</p>}
    </form>
  );
}
