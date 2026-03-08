import { Layout } from '@/components/Layout';
import { ArtifactUpload } from '@/components/ArtifactUpload';
import { PipelineMonitor } from '@/components/PipelineMonitor';
import { DashboardPanel } from '@/components/DashboardPanel';
import { getDashboardData } from '@/lib/dashboardData';

// Prevent prerendering at build time - Vercel build servers can't reach MongoDB Atlas.
// This page needs DB access, so we render it on each request instead.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { promises, triggeredPromises, completedPromises, counts, openRounds } =
    await getDashboardData();
  const firstRoundId = openRounds[0]?.id;

  return (
    <Layout>
      <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-8 lg:flex-row lg:gap-0">
        {/* Left panel: Upload + Live Pipeline Demo */}
        <div className="flex w-full shrink-0 flex-col gap-6 lg:w-[320px]">
          <div className="flex min-h-[120px] flex-col rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50">
            <div className="flex flex-1 min-h-0 items-center justify-center">
              <ArtifactUpload />
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <PipelineMonitor />
          </div>
        </div>

        {/* Right panel: Dashboard */}
        <DashboardPanel
          promises={promises}
          triggeredPromises={triggeredPromises}
          completedPromises={completedPromises}
          counts={counts}
          activeRounds={openRounds.length}
          firstRoundId={firstRoundId}
        />
      </div>
    </Layout>
  );
}
