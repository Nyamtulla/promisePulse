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
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
              Filename
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
              Classification
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
              Pinata CID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
              Matched Promise
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
              Error
            </th>
            {onRetry && (
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
          {artifacts.map((a) => (
            <tr key={a.id}>
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                {a.filename}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={a.processingStatus} />
              </td>
              <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                {a.classification || '-'}
              </td>
              <td className="px-4 py-3 text-sm">
                {a.pinataCid ? (
                  <a
                    href={`https://ipfs.io/ipfs/${a.pinataCid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {a.pinataCid.slice(0, 12)}...
                  </a>
                ) : (
                  '-'
                )}
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                {a.matchedPromise
                  ? a.matchedPromise.promiseText.slice(0, 60) + '...'
                  : '-'}
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {a.errorMessage || '-'}
              </td>
              {onRetry && a.processingStatus === 'ERROR' && (
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onRetry(a.id)}
                    className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
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
