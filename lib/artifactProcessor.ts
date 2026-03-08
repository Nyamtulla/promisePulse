import { readFile } from 'fs/promises';
import { rename, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import {
  Artifact,
  PromiseRecord,
  TriggerEvent,
  ReviewRound,
  TimelineEvent,
} from '@/models';
import { readArtifact, isSupportedFile } from './artifactReader';
import { uploadFileToPinata } from './pinata';
import { classifyArtifact, type ClassificationResult, type ExistingPromise } from './ai';
import {
  addPromiseOnChain,
  addEvidenceOnChain,
  openReviewRoundOnChain,
  hashPromiseText,
  isBlockchainConfigured,
} from './blockchain';
import { emitPipelineEvent, type PipelineEvent } from './pipelineEvents';
import mongoose from 'mongoose';

const ARTIFACTS_PATH = process.env.ARTIFACTS_PATH || './artifacts';
const REVIEW_DURATION_HOURS = process.env.REVIEW_ROUND_DURATION_HOURS
  ? parseInt(process.env.REVIEW_ROUND_DURATION_HOURS, 10)
  : null;
const REVIEW_DURATION_DAYS = parseInt(process.env.REVIEW_ROUND_DURATION_DAYS || '7', 10);

export interface ProcessArtifactOptions {
  eventCollector?: PipelineEvent[];
  onEvent?: (e: PipelineEvent) => void;
}

export async function processArtifact(
  inputPath: string,
  opts?: ProcessArtifactOptions
): Promise<{ artifactId: string; error?: string }> {
  const emit = (e: PipelineEvent) => {
    opts?.eventCollector?.push(e);
    opts?.onEvent?.(e);
    emitPipelineEvent(e);
  };
  const path = require('path');
  let filePath = inputPath;
  if (!path.isAbsolute(filePath) && !filePath.includes(path.sep)) {
    filePath = path.join(ARTIFACTS_PATH, 'incoming', inputPath);
  }
  if (!path.isAbsolute(filePath)) {
    filePath = path.join(process.cwd(), filePath);
  }
  const filename = path.basename(filePath);

  if (!isSupportedFile(filename)) {
    return { artifactId: '', error: `Unsupported file type: ${path.extname(filename)}` };
  }

  const relativePath = path.relative(process.cwd(), filePath) || filePath;
  let artifact = await Artifact.findOne({ relativePath: relativePath });
  if (!artifact) {
    artifact = await Artifact.create({
      filename,
      relativePath: relativePath,
      fileType: path.extname(filename).slice(1).toLowerCase().replace('.', ''),
      processingStatus: 'PROCESSING',
    });
  } else if (artifact.processingStatus === 'PROCESSED' || artifact.processingStatus === 'UNMATCHED') {
    return { artifactId: artifact.id, error: 'Already processed' };
  }

  try {
    artifact.processingStatus = 'PROCESSING';
    await artifact.save();
    emit({ artifactId: artifact.id, filename, stage: 'detected', detail: 'Detected', message: 'New file detected in upload' });

    const readResult = await readArtifact(filePath, filename);
    artifact.extractedText = readResult.extractedText;
    artifact.fileSize = readResult.size;
    await artifact.save();
    emit({ artifactId: artifact.id, filename, stage: 'extracted', detail: 'Extracted', message: 'Text content extracted from file' });

    const pinataCid = await uploadFileToPinata(filePath, filename);
    artifact.pinataCid = pinataCid;
    await artifact.save();
    emit({ artifactId: artifact.id, filename, stage: 'stored', detail: 'On IPFS', message: 'File pinned to IPFS via Pinata' });

    const existingPromises: ExistingPromise[] = await PromiseRecord.find()
      .limit(50)
      .lean()
      .then((docs) =>
        docs.map((p) => ({
          id: (p as unknown as { _id: mongoose.Types.ObjectId })._id.toString(),
          summary: (p as unknown as { promiseText: string }).promiseText.slice(0, 150),
        }))
      );

    const classification = await classifyArtifact(readResult.extractedText, existingPromises);
    emit({
      artifactId: artifact.id,
      filename,
      stage: 'classified',
      detail:
        classification.classification === 'NEW_PROMISE'
          ? 'Pledge extracted by AI'
          : classification.classification === 'PROMISE_UPDATE'
            ? 'Update matched by AI'
            : 'Irrelevant',
      message:
        classification.classification === 'NEW_PROMISE'
          ? (classification as { rationale?: string }).rationale
          : classification.classification === 'PROMISE_UPDATE'
            ? (classification as { reason?: string }).reason
            : (classification as { explanation?: string }).explanation,
    });

    if (classification.classification === 'NEW_PROMISE') {
      for (const p of classification.promises) {
        const promiseHash = hashPromiseText(p.promiseText);
        let txHash: string | null = null;
        let onChainPromiseId: number | null = null;

        if (isBlockchainConfigured()) {
          const result = await addPromiseOnChain(
            promiseHash,
            p.category || 'infrastructure',
            p.region || '',
            pinataCid
          );
          if (result) {
            txHash = result.txHash;
            onChainPromiseId = Number(result.promiseId);
            emit({ artifactId: artifact.id, filename, stage: 'recorded', detail: 'Pledge recorded on-chain', message: 'New pledge written to blockchain' });
          }
        }

        const promise = await PromiseRecord.create({
          promiseText: p.promiseText,
          promiseHash: promiseHash,
          category: p.category || 'infrastructure',
          region: p.region || '',
          sourceArtifactId: artifact._id,
          sourcePinataCid: pinataCid,
          extractionConfidence: p.confidence ?? 1,
          status: 'RECORDED',
          onChainTxHash: txHash,
          onChainPromiseId,
        });

        await TimelineEvent.create({
          promiseId: promise._id,
          eventType: 'PROMISE_RECORDED',
          title: 'Pledge Recorded',
          description: `Campaign pledge extracted from artifact: ${p.summary || p.promiseText.slice(0, 80)}`,
          relatedArtifactId: artifact._id,
          txHash: txHash || undefined,
        });
      }

      artifact.classification = 'NEW_PROMISE';
      artifact.processingStatus = 'PROCESSED';
      artifact.processedAt = new Date();
      await artifact.save();
      await moveFile(filePath, filename, 'processed');
    } else if (classification.classification === 'PROMISE_UPDATE') {
      const matchedId = classification.matchedPromiseId || classification.matchedCandidates?.[0];
      if (!matchedId) {
        artifact.classification = 'IRRELEVANT';
        artifact.processingStatus = 'UNMATCHED';
        artifact.processedAt = new Date();
        artifact.errorMessage = 'PROMISE_UPDATE but no matched pledge';
        await artifact.save();
        await moveFile(filePath, filename, 'unmatched');
        return { artifactId: artifact.id };
      }

      const promise = await PromiseRecord.findById(matchedId);
      if (!promise) {
        artifact.classification = 'IRRELEVANT';
        artifact.processingStatus = 'UNMATCHED';
        artifact.processedAt = new Date();
        artifact.errorMessage = `Matched pledge ${matchedId} not found`;
        await artifact.save();
        await moveFile(filePath, filename, 'unmatched');
        return { artifactId: artifact.id };
      }

      let evidenceTxHash: string | null = null;
      if (isBlockchainConfigured() && promise.onChainPromiseId != null) {
        evidenceTxHash = await addEvidenceOnChain(
          promise.onChainPromiseId,
          pinataCid,
          classification.triggerType || 'update'
        );
        emit({ artifactId: artifact.id, filename, stage: 'recorded', detail: 'Evidence recorded on-chain', message: 'Update evidence linked to existing pledge on blockchain' });
      }

      const trigger = await TriggerEvent.create({
        promiseId: promise._id,
        artifactId: artifact._id,
        summary: classification.summary || 'Progress update detected',
        triggerType: classification.triggerType || 'update',
        matchConfidence: classification.confidence ?? 1,
        onChainTxHash: evidenceTxHash,
      });

      const endTime = new Date();
      if (REVIEW_DURATION_HOURS != null) {
        endTime.setTime(endTime.getTime() + REVIEW_DURATION_HOURS * 60 * 60 * 1000);
      } else {
        endTime.setDate(endTime.getDate() + REVIEW_DURATION_DAYS);
      }

      let roundTxHash: string | null = null;
      let onChainReviewRoundId: number | null = null;
      if (isBlockchainConfigured() && promise.onChainPromiseId != null) {
        const result = await openReviewRoundOnChain(
          promise.onChainPromiseId,
          pinataCid,
          Math.floor(endTime.getTime() / 1000)
        );
        if (result) {
          roundTxHash = result.txHash;
          onChainReviewRoundId = Number(result.reviewRoundId);
          emit({ artifactId: artifact.id, filename, stage: 'voting_opened', detail: 'Citizen voting opened', message: 'Citizens can vote on pledge progress' });
        }
      }

      const reviewRound = await ReviewRound.create({
        promiseId: promise._id,
        triggerEventId: trigger._id,
        startTime: new Date(),
        endTime,
        status: 'OPEN',
        onChainTxHash: roundTxHash,
        onChainReviewRoundId,
      });

      promise.status = 'UNDER_REVIEW';
      await promise.save();

      artifact.classification = 'PROMISE_UPDATE';
      artifact.matchedPromiseId = promise._id;
      artifact.processingStatus = 'PROCESSED';
      artifact.processedAt = new Date();
      await artifact.save();

      await TimelineEvent.create({
        promiseId: promise._id,
        eventType: 'REVIEW_ROUND_OPENED',
        title: 'Review Round Opened',
        description: classification.summary || 'Citizen voting opened for this pledge update',
        relatedTriggerId: trigger._id,
        relatedReviewRoundId: reviewRound._id,
        relatedArtifactId: artifact._id,
        txHash: roundTxHash || undefined,
      });

      await moveFile(filePath, filename, 'processed');
    } else {
      artifact.classification = 'IRRELEVANT';
      artifact.processingStatus = 'UNMATCHED';
      artifact.processedAt = new Date();
      await artifact.save();
      await moveFile(filePath, filename, 'unmatched');
    }

    return { artifactId: artifact.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    artifact.processingStatus = 'ERROR';
    artifact.errorMessage = message;
    await artifact.save();
    await moveFile(filePath, filename, 'error').catch(() => {});
    console.error('Artifact processing error:', err);
    return { artifactId: artifact.id, error: message };
  }
}

async function moveFile(
  srcPath: string,
  filename: string,
  dest: 'processed' | 'unmatched' | 'error'
) {
  // On Vercel, filesystem is read-only except /tmp. Skip move; file is ephemeral anyway.
  if (process.env.VERCEL) return;

  const base = join(process.cwd(), ARTIFACTS_PATH);
  let src = srcPath;
  const path = require('path');
  if (!path.isAbsolute(src)) {
    src = join(process.cwd(), src);
  }
  const exists = await import('fs/promises').then((fs) => fs.access(src).then(() => true).catch(() => false));
  if (!exists) {
    src = join(base, 'incoming', filename);
  }
  const destDir = join(base, dest);
  const destPath = join(destDir, filename);
  await mkdir(destDir, { recursive: true });
  await rename(src, destPath);
}
