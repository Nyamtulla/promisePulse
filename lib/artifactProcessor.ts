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
import mongoose from 'mongoose';

const ARTIFACTS_PATH = process.env.ARTIFACTS_PATH || './artifacts';
const REVIEW_DURATION_DAYS = parseInt(process.env.REVIEW_ROUND_DURATION_DAYS || '7', 10);

export async function processArtifact(inputPath: string): Promise<{ artifactId: string; error?: string }> {
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

    const readResult = await readArtifact(filePath, filename);
    artifact.extractedText = readResult.extractedText;
    artifact.fileSize = readResult.size;
    await artifact.save();

    const pinataCid = await uploadFileToPinata(filePath, filename);
    artifact.pinataCid = pinataCid;
    await artifact.save();

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
          title: 'Promise Recorded',
          description: `Promise extracted from artifact: ${p.summary || p.promiseText.slice(0, 80)}`,
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
        artifact.errorMessage = 'PROMISE_UPDATE but no matched promise';
        await artifact.save();
        await moveFile(filePath, filename, 'unmatched');
        return { artifactId: artifact.id };
      }

      const promise = await PromiseRecord.findById(matchedId);
      if (!promise) {
        artifact.classification = 'IRRELEVANT';
        artifact.processingStatus = 'UNMATCHED';
        artifact.processedAt = new Date();
        artifact.errorMessage = `Matched promise ${matchedId} not found`;
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
      endTime.setDate(endTime.getDate() + REVIEW_DURATION_DAYS);

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
        description: classification.summary || 'Citizen voting opened for this update',
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
