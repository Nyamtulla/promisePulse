'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

const LOCATIONS = [
  'Lawrence, KS',
  'Kansas City',
  'Topeka',
  'Wichita',
];

const MOCK_GOVERNMENT: Record<string, { officials: { role: string; name: string }[]; council: { label: string; count: number } }> = {
  'Lawrence, KS': {
    officials: [
      { role: 'Mayor', name: 'Lisa Larsen' },
      { role: 'City Manager', name: 'David Mitchell' },
    ],
    council: { label: 'Commission', count: 5 },
  },
  'Kansas City': {
    officials: [
      { role: 'Mayor', name: 'Quinton Lucas' },
      { role: 'City Manager', name: 'Brian Platt' },
    ],
    council: { label: 'Council', count: 13 },
  },
  'Topeka': {
    officials: [
      { role: 'Mayor', name: 'Mike Padilla' },
      { role: 'City Manager', name: '—' },
    ],
    council: { label: 'Council', count: 9 },
  },
  'Wichita': {
    officials: [
      { role: 'Mayor', name: 'Lily Wu' },
      { role: 'City Manager', name: '—' },
    ],
    council: { label: 'Council', count: 7 },
  },
};

export function LocationSelector() {
  const [selected, setSelected] = useState('Lawrence, KS');
  const [activeLocation, setActiveLocation] = useState<string | null>('Lawrence, KS');

  const gov = activeLocation && MOCK_GOVERNMENT[activeLocation];

  function handleView() {
    if (!selected) return;
    setActiveLocation(selected);
  }

  return (
    <div className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50">
      <div className="flex gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="flex-1 min-w-0 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          <option value="">Select city</option>
          {LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleView}
          disabled={!selected}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
          Apply
        </button>
      </div>

      {activeLocation && gov && (() => {
        const mayor = gov.officials.find((o) => o.role === 'Mayor');
        const manager = gov.officials.find((o) => o.role.includes('Manager'));
        const council = gov.council;
        const show = mayor || manager || council;
        return show ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {mayor && (
              <span className="inline-flex rounded-md border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                <span className="font-medium text-slate-600">Mayor:</span> {mayor.name}
              </span>
            )}
            {manager && (
              <span className="inline-flex rounded-md border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                <span className="font-medium text-slate-600">Manager:</span> {manager.name}
              </span>
            )}
            {council && (
              <span className="inline-flex rounded-md border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                <span className="font-medium text-slate-600">{council.label}:</span> {council.count}
              </span>
            )}
          </div>
        ) : null;
      })()}
    </div>
  );
}
