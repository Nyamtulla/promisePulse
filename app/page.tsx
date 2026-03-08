import { Layout } from '@/components/Layout';
import { ArtifactUpload } from '@/components/ArtifactUpload';
import { PipelineMonitor } from '@/components/PipelineMonitor';
import { DashboardPanel } from '@/components/DashboardPanel';

async function getData() {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const [promisesRes, activeRes, completedRes, countsRes, roundsRes] = await Promise.all([
    fetch(`${base}/api/promises?status=RECORDED`, { cache: 'no-store' }),
    fetch(`${base}/api/promises?active=true`, { cache: 'no-store' }),
    fetch(`${base}/api/promises?reviewed=true`, { cache: 'no-store' }),
    fetch(`${base}/api/promises/counts`, { cache: 'no-store' }),
    fetch(`${base}/api/review-rounds/open`, { cache: 'no-store' }),
  ]);
  const [promisesData, activeData, completedData, countsData, roundsData] = await Promise.all([
    promisesRes.json(),
    activeRes.json(),
    completedRes.json(),
    countsRes.json(),
    roundsRes.json(),
  ]);
  return {
    promises: promisesData.promises || [],
    triggeredPromises: activeData.promises || [],
    completedPromises: completedData.promises || [],
    counts: {
      total: countsData.total ?? 0,
      underReview: countsData.underReview ?? 0,
      reviewed: countsData.reviewed ?? 0,
      notFulfilled: countsData.notFulfilled ?? 0,
      pledgesVoted: countsData.pledgesVoted ?? 0,
    },
    openRounds: roundsData.rounds || [],
  };
}

export default async function HomePage() {
  const { promises, triggeredPromises, completedPromises, counts, openRounds } = await getData();
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
