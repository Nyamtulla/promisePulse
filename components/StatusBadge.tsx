type Status = 'RECORDED' | 'UNDER_REVIEW' | 'IN_PROGRESS' | 'PARTIALLY_DONE' | 'DONE';

const STATUS_STYLES: Record<Status, string> = {
  RECORDED: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
  UNDER_REVIEW: 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100',
  IN_PROGRESS: 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100',
  PARTIALLY_DONE: 'bg-cyan-200 text-cyan-900 dark:bg-cyan-800 dark:text-cyan-100',
  DONE: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100',
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status as Status] || STATUS_STYLES.RECORDED;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
