import { StatusBadge } from './StatusBadge';

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

interface ArtifactTableProps {
  artifacts: Artifact[];
  onRetry?: (id: string) => void;
}

export function ArtifactTable({ artifacts, onRetry }: ArtifactTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
              Filename
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
              Classification
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
              Pinata CID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
              Matched Pledge
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
              Error
            </th>
            {onRetry && (
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {artifacts.map((a) => (
            <tr key={a.id}>
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">
                {a.filename}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={a.processingStatus} />
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">
                {a.classification || '-'}
              </td>
              <td className="px-4 py-3 text-sm">
                {a.pinataCid ? (
                  <a
                    href={`https://ipfs.io/ipfs/${a.pinataCid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
                  >
                    {a.pinataCid.slice(0, 12)}...
                  </a>
                ) : (
                  '-'
                )}
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-sm text-slate-600">
                {a.matchedPromise
                  ? a.matchedPromise.promiseText.slice(0, 60) + '...'
                  : '-'}
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-sm text-red-600">
                {a.errorMessage || '-'}
              </td>
              {onRetry && a.processingStatus === 'ERROR' && (
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onRetry(a.id)}
                    className="text-sm font-medium text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
                  >
                    Retry
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
