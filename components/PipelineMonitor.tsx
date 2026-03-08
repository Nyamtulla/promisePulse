'use client';

import { useEffect, useState } from 'react';
import { FileText, FileEdit, Package, Bot, Link2, Vote } from 'lucide-react';

type PipelineStage = 'detected' | 'extracted' | 'classified' | 'stored' | 'recorded' | 'voting_opened';

interface PipelineEvent {
  artifactId: string;
  filename: string;
  stage: PipelineStage;
  detail?: string;
  message?: string;
}

const STAGES: { id: PipelineStage; label: string; short: string; Icon: typeof FileText }[] = [
  { id: 'detected', label: 'Artifact detected', short: 'Detected', Icon: FileText },
  { id: 'extracted', label: 'Text extracted', short: 'Extracted', Icon: FileEdit },
  { id: 'stored', label: 'Stored on Pinata', short: 'On IPFS', Icon: Package },
  { id: 'classified', label: 'AI classified', short: 'Classified', Icon: Bot },
  { id: 'recorded', label: 'Recorded on blockchain', short: 'On-chain', Icon: Link2 },
  { id: 'voting_opened', label: 'Voting opened', short: 'Voting open', Icon: Vote },
];

function ZigzagConnector({ toRight, done }: { toRight: boolean; done: boolean }) {
  const stroke = done ? '#0d9488' : '#cbd5e1';
  return (
    <div className="flex w-full justify-center py-0.5">
      <svg width="120" height="14" viewBox="0 0 120 14" className="overflow-visible">
        <path
          d={toRight ? 'M 0 0 Q 60 0 120 14' : 'M 120 0 Q 60 0 0 14'}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="4 3"
          className="transition-all duration-300"
        />
        <path
          d={toRight ? 'M 105 10 L 120 14 L 110 8' : 'M 15 10 L 0 14 L 10 8'}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-colors duration-300"
        />
      </svg>
    </div>
  );
}

export function PipelineMonitor() {
  const [currentFilename, setCurrentFilename] = useState<string | null>(null);
  const [completedStages, setCompletedStages] = useState<PipelineStage[]>([]);
  const [activeStage, setActiveStage] = useState<PipelineStage | null>(null);
  const [classificationResult, setClassificationResult] = useState<string | null>(null);
  const [stageMessages, setStageMessages] = useState<Partial<Record<PipelineStage, string>>>({});
  const [isConnected, setIsConnected] = useState(false);

  const applyEvent = (event: PipelineEvent) => {
    setCurrentFilename(event.filename);
    if (event.stage === 'classified' && event.detail) {
      setClassificationResult(
        event.detail.includes('Pledge extracted') ? 'Pledge extracted by AI' : event.detail.includes('Update matched') ? 'Update matched by AI' : 'Irrelevant'
      );
    }
    if (event.message) {
      setStageMessages((prev) => ({ ...prev, [event.stage]: event.message }));
    }
    setCompletedStages((prev) => {
      if (event.stage === 'detected') {
        setClassificationResult(null);
        setStageMessages({});
        return [event.stage];
      }
      return prev.includes(event.stage) ? prev : [...prev, event.stage];
    });
    setActiveStage(event.stage);
    setTimeout(() => setActiveStage(null), 400);
  };

  useEffect(() => {
    const url = '/api/pipeline/stream';
    const eventSource = new EventSource(url);

    eventSource.onopen = () => setIsConnected(true);
    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
    };

    eventSource.onmessage = (e) => {
      if (e.data.startsWith(':')) return;
      try {
        const event: PipelineEvent = JSON.parse(e.data);
        applyEvent(event);
      } catch {
        // ignore parse errors
      }
    };

    const onLiveEvent = (ev: Event) => {
      const event = (ev as CustomEvent<PipelineEvent>).detail;
      if (event?.stage) applyEvent(event);
    };

    const onReplay = (ev: Event) => {
      const { events } = (ev as CustomEvent<{ events: PipelineEvent[] }>).detail;
      if (!events?.length) return;
      events.forEach((event, i) => {
        setTimeout(() => applyEvent(event), i * 350);
      });
    };

    window.addEventListener('pipeline-event', onLiveEvent);
    window.addEventListener('pipeline-replay', onReplay);

    return () => {
      eventSource.close();
      window.removeEventListener('pipeline-event', onLiveEvent);
      window.removeEventListener('pipeline-replay', onReplay);
      setIsConnected(false);
    };
  }, []);

  const pipelineIdle = completedStages.length > 0 && !activeStage;
  const filteredStages = STAGES.filter((stage) => {
    if (stage.id === 'recorded' && classificationResult === 'Irrelevant') return false;
    if (stage.id === 'voting_opened') {
      if (classificationResult === 'Irrelevant') return false;
      if (classificationResult === 'Pledge extracted by AI') return false;
    }
    return true;
  });

  return (
    <div className="flex h-full min-h-[280px] flex-col rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-slate-600">
          Live pipeline
        </h2>
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full transition-colors ${
              isConnected ? 'animate-pulse bg-teal-600' : 'bg-slate-400'
            }`}
          />
          <span className="text-xs text-slate-600">
            {isConnected ? 'Live' : 'Connecting…'}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col overflow-auto">
        {currentFilename && (
          <p className="mb-3 flex w-full items-center justify-center gap-1.5 truncate rounded-lg border-2 border-dashed border-slate-200/80 bg-slate-50/80 px-2 py-1.5 text-center text-xs font-medium text-slate-700">
            <FileText className="h-3.5 w-3.5 shrink-0 text-slate-600" />
            {currentFilename}
          </p>
        )}
        <div className="flex flex-col gap-0">
          {filteredStages.map((stage, idx) => {
            const done = completedStages.includes(stage.id);
            const active = activeStage === stage.id;
            const isLeft = idx % 2 === 0;
            const isClassified = stage.id === 'classified';
            const floatingMessage = done ? stageMessages[stage.id] : null;

            return (
              <div key={stage.id} className="flex flex-col">
                {/* Zigzag connector from previous */}
                {idx > 0 && (
                  <ZigzagConnector
                    toRight={(idx - 1) % 2 === 0}
                    done={completedStages.includes(filteredStages[idx - 1].id)}
                  />
                )}
                {/* Row: stage on one side, floating message on the other */}
                <div className={`flex w-full items-start gap-2 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
                  {/* Stage block */}
                  <div
                    className={`
                      flex shrink-0 w-fit max-w-[130px] items-center gap-2 rounded-lg border-2 px-3 py-2
                      transition-all duration-300 ease-out
                      ${done
                        ? 'border-teal-300 bg-teal-50/80 shadow-sm shadow-teal-100/50'
                        : active
                          ? 'animate-pipeline-active border-slate-400 bg-slate-100 shadow-md shadow-slate-200/50'
                          : 'border-slate-200/80 bg-slate-50/80'
                      }
                    `}
                  >
                    <stage.Icon className={`h-3.5 w-3.5 shrink-0 ${
                      done ? 'text-teal-700' : active ? 'text-slate-700' : 'text-slate-500'
                    }`} />
                    <span
                      className={`max-w-[80px] truncate text-xs font-medium ${
                        done ? 'text-teal-800' : active ? 'text-slate-800' : 'text-slate-500'
                      }`}
                      title={isClassified && classificationResult ? classificationResult : undefined}
                    >
                      {stage.short}
                      {isClassified && classificationResult && (
                        <span className="ml-1 font-normal text-slate-500">
                          → {classificationResult}
                        </span>
                      )}
                    </span>
                    {done && <span className="shrink-0 text-teal-600">✓</span>}
                    {active && (
                      <span className="h-1.5 w-1.5 shrink-0 animate-ping rounded-full bg-slate-500" />
                    )}
                  </div>
                  {/* Floating message in empty space - only when step done and message exists */}
                  <div className={`min-w-0 flex-1 ${isLeft ? 'pl-2' : 'pr-2'}`}>
                    {floatingMessage && (
                      <div className="rounded-lg border-2 border-dashed border-slate-200/80 bg-slate-50/95 px-2.5 py-1.5 text-[11px] leading-snug text-slate-700">
                        {floatingMessage}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {pipelineIdle && completedStages.length > 0 && (
          <p className="mt-4 w-full rounded-lg border-2 border-dashed border-teal-200 bg-teal-50/80 px-2 py-1.5 text-center text-xs font-medium text-teal-700">
            ✓ Complete. Upload another document.
          </p>
        )}
      </div>
    </div>
  );
}
