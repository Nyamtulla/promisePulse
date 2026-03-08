interface TimelineItem {
  id: string;
  eventType: string;
  title: string;
  description?: string;
  createdAt: string;
  txHash?: string;
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {items.map((item, idx) => (
          <li key={item.id}>
            <div className="relative pb-8">
              {idx !== items.length - 1 && (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-200"
                  aria-hidden
                />
              )}
              <div className="relative flex space-x-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-200">
                  <span className="text-xs font-medium text-slate-600">
                    {idx + 1}
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="font-medium text-slate-900">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-sm text-slate-500">
                      {item.description}
                    </p>
                  )}
                  <p className="text-xs text-slate-400">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                  {item.txHash && (
                    <a
                      href={`https://amoy.polygonscan.com/tx/${item.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
                    >
                      View transaction
                    </a>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
