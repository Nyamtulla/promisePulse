import Link from 'next/link';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-slate-200/80 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-start justify-between gap-4 px-6 py-6">
          <div className="flex-1" />
          <div className="flex flex-col items-center">
            <Link
              href="/"
              className="font-display text-4xl font-semibold tracking-tight text-slate-900 hover:text-slate-700 sm:text-5xl"
            >
              GovernancePulse
            </Link>
            <p className="mt-2 text-center text-sm text-slate-600">
              AI & blockchain–powered tracking for campaign pledges and government commitments
            </p>
          </div>
          <div className="flex flex-1 justify-end">
            <Link
              href="/admin"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 underline-offset-4 hover:underline"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
