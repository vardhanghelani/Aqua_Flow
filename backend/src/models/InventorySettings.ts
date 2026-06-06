import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IInventorySettings extends Document {
  organizationId?: Types.ObjectId;
  totalCoolersOwned: number;
  warehouseStock: number;
  inTransit: number;
  inCirculation: number;
  damagedStock: number;
  lostStock: number;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const inventorySettingsSchema = new Schema<IInventorySettings>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    totalCoolersOwned: { type: Number, required: true, default: 0, min: 0 },
    warehouseStock: { type: Number, required: true, default: 0, min: 0 },
    inTransit: { type: Number, default: 0, min: 0 },
    inCirculation: { type: Number, default: 0, min: 0 },
    damagedStock: { type: Number, default: 0, min: 0 },
    lostStock: { type: Number, default: 0, min: 0 },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const InventorySettings = mongoose.model<IInventorySettings>(
  'InventorySettings',
  inventorySettingsSchema
);
