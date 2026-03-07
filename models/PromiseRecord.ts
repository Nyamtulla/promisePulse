import mongoose, { Schema, Document, Model } from 'mongoose';

export type PromiseStatus = 'RECORDED' | 'UNDER_REVIEW' | 'IN_PROGRESS' | 'PARTIALLY_DONE' | 'DONE';

export interface IPromiseRecord extends Document {
  id: string;
  promiseText: string;
  promiseHash: string;
  category: string;
  region: string;
  sourceArtifactId: mongoose.Types.ObjectId;
  sourcePinataCid: string;
  extractionConfidence: number;
  status: PromiseStatus;
  createdAt: Date;
  onChainTxHash: string | null;
  onChainPromiseId: number | null;
}

const PromiseRecordSchema = new Schema<IPromiseRecord>(
  {
    promiseText: { type: String, required: true },
    promiseHash: { type: String, required: true },
    category: { type: String, required: true },
    region: { type: String, default: '' },
    sourceArtifactId: { type: Schema.Types.ObjectId, ref: 'Artifact', required: true },
    sourcePinataCid: { type: String, required: true },
    extractionConfidence: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['RECORDED', 'UNDER_REVIEW', 'IN_PROGRESS', 'PARTIALLY_DONE', 'DONE'],
      default: 'RECORDED',
    },
    onChainTxHash: { type: String, default: null },
    onChainPromiseId: { type: Number, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

PromiseRecordSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

export const PromiseRecord: Model<IPromiseRecord> =
  mongoose.models.PromiseRecord || mongoose.model<IPromiseRecord>('PromiseRecord', PromiseRecordSchema);
