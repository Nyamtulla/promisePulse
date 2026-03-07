import mongoose, { Schema, Document, Model } from 'mongoose';

export type VoteOption = 'NOT_VISIBLE' | 'IN_PROGRESS' | 'PARTIALLY_DONE' | 'DONE' | 'NOT_SURE';

export interface IVote extends Document {
  id: string;
  reviewRoundId: mongoose.Types.ObjectId;
  voterId: string;
  selectedOption: VoteOption;
  comment: string | null;
  proofCid: string | null;
  createdAt: Date;
  onChainTxHash: string | null;
}

const VoteSchema = new Schema<IVote>(
  {
    reviewRoundId: { type: Schema.Types.ObjectId, ref: 'ReviewRound', required: true },
    voterId: { type: String, required: true },
    selectedOption: {
      type: String,
      enum: ['NOT_VISIBLE', 'IN_PROGRESS', 'PARTIALLY_DONE', 'DONE', 'NOT_SURE'],
      required: true,
    },
    comment: { type: String, default: null },
    proofCid: { type: String, default: null },
    onChainTxHash: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

VoteSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

VoteSchema.index({ reviewRoundId: 1, voterId: 1 }, { unique: true });

export const Vote: Model<IVote> =
  mongoose.models.Vote || mongoose.model<IVote>('Vote', VoteSchema);
