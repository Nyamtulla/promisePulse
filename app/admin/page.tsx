import { Layout } from '@/components/Layout';
import { ArtifactTable } from '@/components/ArtifactTable';
import { AdminClient } from '@/components/AdminClient';

async function getArtifacts() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/artifacts`,
    { cache: 'no-store' }
  );
  return res.json();
}

export default async function AdminPage() {
  const data = await getArtifacts();
  const artifacts = data.artifacts || [];

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        Admin – Artifact Processing
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        View processing history and retry failed artifacts.
      </p>
      <AdminClient artifacts={artifacts} />
    </Layout>
  );
}
