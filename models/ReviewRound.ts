import mongoose, { Schema, Document, Model } from 'mongoose';

export type RoundStatus = 'OPEN' | 'CLOSED';

export interface IReviewRound extends Document {
  id: string;
  promiseId: mongoose.Types.ObjectId;
  triggerEventId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: RoundStatus;
  onChainTxHash: string | null;
  onChainReviewRoundId: number | null;
}

const ReviewRoundSchema = new Schema<IReviewRound>(
  {
    promiseId: { type: Schema.Types.ObjectId, ref: 'PromiseRecord', required: true },
    triggerEventId: { type: Schema.Types.ObjectId, ref: 'TriggerEvent', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
    onChainTxHash: { type: String, default: null },
    onChainReviewRoundId: { type: Number, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ReviewRoundSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

export const ReviewRound: Model<IReviewRound> =
  mongoose.models.ReviewRound || mongoose.model<IReviewRound>('ReviewRound', ReviewRoundSchema);
