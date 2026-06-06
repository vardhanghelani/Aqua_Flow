import mongoose, { Document, Schema, Types } from 'mongoose';

export type CoolerTransactionType =
  | 'delivered'
  | 'returned'
  | 'damaged'
  | 'lost'
  | 'replaced'
  | 'adjustment';

export interface ICoolerTransaction extends Document {
  organizationId?: Types.ObjectId;
  customerId: Types.ObjectId;
  driverId?: Types.ObjectId;
  deliveryId?: Types.ObjectId;
  areaId?: Types.ObjectId;
  type: CoolerTransactionType;
  quantity: number;
  notes?: string;
  reference?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const coolerTransactionSchema = new Schema<ICoolerTransaction>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'Driver' },
    deliveryId: { type: Schema.Types.ObjectId, ref: 'Delivery' },
    areaId: { type: Schema.Types.ObjectId, ref: 'Area' },
    type: {
      type: String,
      enum: ['delivered', 'returned', 'damaged', 'lost', 'replaced', 'adjustment'],
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    notes: { type: String, trim: true },
    reference: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

coolerTransactionSchema.index({ customerId: 1, createdAt: -1 });
coolerTransactionSchema.index({ type: 1, createdAt: -1 });
coolerTransactionSchema.index({ deliveryId: 1 });

export const CoolerTransaction = mongoose.model<ICoolerTransaction>(
  'CoolerTransaction',
  coolerTransactionSchema
);
