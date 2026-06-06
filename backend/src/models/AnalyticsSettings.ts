import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAnalyticsSettings extends Document {
  organizationId?: Types.ObjectId;
  inactiveDaysThreshold: number;
  atRiskDaysThreshold: number;
  excessiveCoolerThreshold: number;
  lowWarehouseThreshold: number;
  unservicedDaysThreshold: number;
  updatedAt: Date;
}

const analyticsSettingsSchema = new Schema<IAnalyticsSettings>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    inactiveDaysThreshold: { type: Number, default: 14 },
    atRiskDaysThreshold: { type: Number, default: 7 },
    excessiveCoolerThreshold: { type: Number, default: 10 },
    lowWarehouseThreshold: { type: Number, default: 50 },
    unservicedDaysThreshold: { type: Number, default: 7 },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const AnalyticsSettings = mongoose.model<IAnalyticsSettings>(
  'AnalyticsSettings',
  analyticsSettingsSchema
);
