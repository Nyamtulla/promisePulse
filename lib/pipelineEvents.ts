import { EventEmitter } from 'events';

export type PipelineStage =
  | 'detected'
  | 'extracted'
  | 'classified'
  | 'stored'
  | 'recorded'
  | 'voting_opened';

export interface PipelineEvent {
  artifactId: string;
  filename: string;
  stage: PipelineStage;
  detail?: string;
  message?: string;
  error?: string;
}

const emitter = new EventEmitter();
emitter.setMaxListeners(100);

export function emitPipelineEvent(event: PipelineEvent) {
  emitter.emit('progress', event);
}

export function onPipelineProgress(callback: (event: PipelineEvent) => void) {
  emitter.on('progress', callback);
  return () => emitter.off('progress', callback);
}
