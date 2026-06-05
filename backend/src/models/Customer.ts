import mongoose, { Document, Schema, Types } from 'mongoose';
import { softDeleteFields } from '../utils/softDelete';

export type CustomerStatus = 'active' | 'inactive';
export type AnalyticsStatus = 'active' | 'at_risk' | 'inactive';

export interface ICustomer extends Document {
  name: string;
  shopName: string;
  mobile: string;
  address: string;
  areaId: Types.ObjectId;
  customPrice?: number;
  status: CustomerStatus;
  totalFilledGiven: number;
  totalEmptyReturned: number;
  currentBalance: number;
  totalLost: number;
  totalDamaged: number;
  analyticsStatus: AnalyticsStatus;
  lastDeliveryDate?: Date;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  locationNotes?: string;
  ledgerBalance: number;
  creditLimit: number;
  creditOverride?: number;
  creditOverrideBy?: Types.ObjectId;
  creditOverrideReason?: string;
  organizationId?: Types.ObjectId;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true },
    shopName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    areaId: { type: Schema.Types.ObjectId, ref: 'Area', required: true, index: true },
    customPrice: { type: Number, min: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    totalFilledGiven: { type: Number, default: 0, min: 0 },
    totalEmptyReturned: { type: Number, default: 0, min: 0 },
    currentBalance: { type: Number, default: 0 },
    totalLost: { type: Number, default: 0, min: 0 },
    totalDamaged: { type: Number, default: 0, min: 0 },
    analyticsStatus: { type: String, enum: ['active', 'at_risk', 'inactive'], default: 'active' },
    lastDeliveryDate: { type: Date },
    latitude: { type: Number },
    longitude: { type: Number },
    googleMapsUrl: { type: String, trim: true },
    locationNotes: { type: String, trim: true },
    ledgerBalance: { type: Number, default: 0 },
    creditLimit: { type: Number, default: 0, min: 0 },
    creditOverride: { type: Number, min: 0 },
    creditOverrideBy: { type: Schema.Types.ObjectId, ref: 'User' },
    creditOverrideReason: { type: String, trim: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    ...softDeleteFields,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

customerSchema.index({ areaId: 1, status: 1, deletedAt: 1 });
customerSchema.index({ analyticsStatus: 1 });
customerSchema.index({ lastDeliveryDate: 1 });
customerSchema.index({ currentBalance: 1 });

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
