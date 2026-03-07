import mongoose, { Schema, Document, Model } from 'mongoose';

export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'UNMATCHED' | 'ERROR';
export type Classification = 'NEW_PROMISE' | 'PROMISE_UPDATE' | 'IRRELEVANT' | null;

export interface IArtifact extends Document {
  id: string;
  filename: string;
  relativePath: string;
  fileType: string;
  extractedText: string;
  pinataCid: string | null;
  classification: Classification;
  processingStatus: ProcessingStatus;
  matchedPromiseId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  processedAt: Date | null;
  errorMessage: string | null;
  fileSize?: number;
}

const ArtifactSchema = new Schema<IArtifact>(
  {
    filename: { type: String, required: true },
    relativePath: { type: String, required: true },
    fileType: { type: String, required: true },
    extractedText: { type: String, default: '' },
    pinataCid: { type: String, default: null },
    classification: { type: String, enum: ['NEW_PROMISE', 'PROMISE_UPDATE', 'IRRELEVANT'], default: null },
    processingStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'PROCESSED', 'UNMATCHED', 'ERROR'],
      default: 'PENDING',
    },
    matchedPromiseId: { type: Schema.Types.ObjectId, ref: 'PromiseRecord', default: null },
    processedAt: { type: Date, default: null },
    errorMessage: { type: String, default: null },
    fileSize: { type: Number, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ArtifactSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

export const Artifact: Model<IArtifact> =
  mongoose.models.Artifact || mongoose.model<IArtifact>('Artifact', ArtifactSchema);
