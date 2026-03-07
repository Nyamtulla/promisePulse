import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITimelineEvent extends Document {
  id: string;
  promiseId: mongoose.Types.ObjectId;
  eventType: string;
  title: string;
  description: string;
  relatedArtifactId: mongoose.Types.ObjectId | null;
  relatedTriggerId: mongoose.Types.ObjectId | null;
  relatedReviewRoundId: mongoose.Types.ObjectId | null;
  relatedVoteId: mongoose.Types.ObjectId | null;
  txHash: string | null;
  createdAt: Date;
}

const TimelineEventSchema = new Schema<ITimelineEvent>(
  {
    promiseId: { type: Schema.Types.ObjectId, ref: 'PromiseRecord', required: true },
    eventType: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    relatedArtifactId: { type: Schema.Types.ObjectId, ref: 'Artifact', default: null },
    relatedTriggerId: { type: Schema.Types.ObjectId, ref: 'TriggerEvent', default: null },
    relatedReviewRoundId: { type: Schema.Types.ObjectId, ref: 'ReviewRound', default: null },
    relatedVoteId: { type: Schema.Types.ObjectId, ref: 'Vote', default: null },
    txHash: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

TimelineEventSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

export const TimelineEvent: Model<ITimelineEvent> =
  mongoose.models.TimelineEvent || mongoose.model<ITimelineEvent>('TimelineEvent', TimelineEventSchema);
