import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPriceHistory extends Document {
  price: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  changedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const priceHistorySchema = new Schema<IPriceHistory>(
  {
    price: { type: Number, required: true, min: 0 },
    effectiveFrom: { type: Date, required: true, default: Date.now },
    effectiveTo: { type: Date },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

priceHistorySchema.index({ effectiveFrom: -1 });

export const PriceHistory = mongoose.model<IPriceHistory>('PriceHistory', priceHistorySchema);
