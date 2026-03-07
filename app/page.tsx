import Link from 'next/link';
import { Layout } from '@/components/Layout';

export default function Home() {
  return (
    <Layout>
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
          PromisePulse
        </h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
          AI-powered public promise tracking for local infrastructure accountability
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-lg bg-slate-900 px-6 py-3 font-medium text-white dark:bg-slate-100 dark:text-slate-900"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/promises"
            className="rounded-lg border border-slate-300 px-6 py-3 font-medium dark:border-slate-600 dark:text-slate-100"
          >
            Browse Promises
          </Link>
        </div>
      </div>
    </Layout>
  );
}
