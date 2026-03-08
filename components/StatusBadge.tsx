type Status = 'RECORDED' | 'UNDER_REVIEW' | 'IN_PROGRESS' | 'PARTIALLY_DONE' | 'DONE';

const STATUS_STYLES: Record<Status, string> = {
  RECORDED: 'bg-slate-100 text-slate-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-800',
  IN_PROGRESS: 'bg-slate-200 text-slate-700',
  PARTIALLY_DONE: 'bg-teal-100 text-teal-800',
  DONE: 'bg-teal-100 text-teal-800',
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status as Status] || STATUS_STYLES.RECORDED;
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
