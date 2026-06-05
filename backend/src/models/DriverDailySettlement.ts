import mongoose, { Document, Schema, Types } from 'mongoose';

export type SettlementStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface IDriverDailySettlement extends Document {
  driverId: Types.ObjectId;
  areaId?: Types.ObjectId;
  settlementDate: Date;
  openingStock: number;
  deliveriesMade: number;
  emptyReturns: number;
  damagedCoolers: number;
  lostCoolers: number;
  closingStock: number;
  expectedClosing: number;
  variance: number;
  cashCollected: number;
  notes?: string;
  status: SettlementStatus;
  submittedAt?: Date;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectedReason?: string;
  organizationId?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const settlementSchema = new Schema<IDriverDailySettlement>(
  {
    driverId: { type: Schema.Types.ObjectId, ref: 'Driver', required: true, index: true },
    areaId: { type: Schema.Types.ObjectId, ref: 'Area' },
    settlementDate: { type: Date, required: true },
    openingStock: { type: Number, default: 0, min: 0 },
    deliveriesMade: { type: Number, default: 0, min: 0 },
    emptyReturns: { type: Number, default: 0, min: 0 },
    damagedCoolers: { type: Number, default: 0, min: 0 },
    lostCoolers: { type: Number, default: 0, min: 0 },
    closingStock: { type: Number, default: 0, min: 0 },
    expectedClosing: { type: Number, default: 0 },
    variance: { type: Number, default: 0 },
    cashCollected: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true },
    status: { type: String, enum: ['draft', 'submitted', 'approved', 'rejected'], default: 'draft' },
    submittedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectedReason: { type: String, trim: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

settlementSchema.index({ driverId: 1, settlementDate: 1 }, { unique: true });
settlementSchema.index({ status: 1, settlementDate: -1 });

export const DriverDailySettlement = mongoose.model<IDriverDailySettlement>(
  'DriverDailySettlement',
  settlementSchema
);
