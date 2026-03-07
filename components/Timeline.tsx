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
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-600"
                  aria-hidden
                />
              )}
              <div className="relative flex space-x-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {idx + 1}
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {item.description}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                  {item.txHash && (
                    <a
                      href={`https://amoy.polygonscan.com/tx/${item.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline dark:text-blue-400"
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
