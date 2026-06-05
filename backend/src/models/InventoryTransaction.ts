import mongoose, { Document, Schema, Types } from 'mongoose';

export type InventoryTransactionType = 'delivery' | 'adjustment' | 'initial';

export interface IInventoryTransaction extends Document {
  type: InventoryTransactionType;
  deliveryId?: Types.ObjectId;
  filledOut: number;
  emptyIn: number;
  warehouseAfter: number;
  notes?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    type: { type: String, enum: ['delivery', 'adjustment', 'initial'], required: true },
    deliveryId: { type: Schema.Types.ObjectId, ref: 'Delivery' },
    filledOut: { type: Number, default: 0, min: 0 },
    emptyIn: { type: Number, default: 0, min: 0 },
    warehouseAfter: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const InventoryTransaction = mongoose.model<IInventoryTransaction>(
  'InventoryTransaction',
  inventoryTransactionSchema
);
