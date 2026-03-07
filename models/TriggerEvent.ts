import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITriggerEvent extends Document {
  id: string;
  promiseId: mongoose.Types.ObjectId;
  artifactId: mongoose.Types.ObjectId;
  summary: string;
  triggerType: string;
  matchConfidence: number;
  createdAt: Date;
  onChainTxHash: string | null;
}

const TriggerEventSchema = new Schema<ITriggerEvent>(
  {
    promiseId: { type: Schema.Types.ObjectId, ref: 'PromiseRecord', required: true },
    artifactId: { type: Schema.Types.ObjectId, ref: 'Artifact', required: true },
    summary: { type: String, required: true },
    triggerType: { type: String, required: true },
    matchConfidence: { type: Number, default: 1 },
    onChainTxHash: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

TriggerEventSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

export const TriggerEvent: Model<ITriggerEvent> =
  mongoose.models.TriggerEvent || mongoose.model<ITriggerEvent>('TriggerEvent', TriggerEventSchema);
