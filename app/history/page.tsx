import { Layout } from '@/components/Layout';
import { AdminClient } from '@/components/AdminClient';
import { getAdminArtifacts } from '@/lib/adminData';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  const { artifacts } = await getAdminArtifacts();

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-slate-900">
        Processing History
      </h1>
      <p className="mt-2 text-slate-600">
        View artifact processing history and retry failed artifacts.
      </p>
      <AdminClient artifacts={artifacts} />
    </Layout>
  );
}
