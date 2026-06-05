import mongoose, { Document, Schema, Types } from 'mongoose';

export type CollectionPaymentMethod = 'cash' | 'upi' | 'cheque' | 'bank' | 'other';

export interface IDriverCollection extends Document {
  driverId: Types.ObjectId;
  customerId?: Types.ObjectId;
  settlementId?: Types.ObjectId;
  invoiceId?: Types.ObjectId;
  paymentId?: Types.ObjectId;
  amount: number;
  paymentMethod: CollectionPaymentMethod;
  collectionDate: Date;
  referenceNumber?: string;
  notes?: string;
  reconciled: boolean;
  reconciledAt?: Date;
  reconciledBy?: Types.ObjectId;
  organizationId?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const collectionSchema = new Schema<IDriverCollection>(
  {
    driverId: { type: Schema.Types.ObjectId, ref: 'Driver', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    settlementId: { type: Schema.Types.ObjectId, ref: 'DriverDailySettlement' },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMethod: { type: String, enum: ['cash', 'upi', 'cheque', 'bank', 'other'], required: true },
    collectionDate: { type: Date, required: true, default: Date.now },
    referenceNumber: { type: String, trim: true },
    notes: { type: String, trim: true },
    reconciled: { type: Boolean, default: false },
    reconciledAt: { type: Date },
    reconciledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

collectionSchema.index({ driverId: 1, collectionDate: -1 });
collectionSchema.index({ reconciled: 1 });

export const DriverCollection = mongoose.model<IDriverCollection>('DriverCollection', collectionSchema);
