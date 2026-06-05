import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalyticsSettings extends Document {
  inactiveDaysThreshold: number;
  atRiskDaysThreshold: number;
  excessiveCoolerThreshold: number;
  lowWarehouseThreshold: number;
  unservicedDaysThreshold: number;
  updatedAt: Date;
}

const analyticsSettingsSchema = new Schema<IAnalyticsSettings>(
  {
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
