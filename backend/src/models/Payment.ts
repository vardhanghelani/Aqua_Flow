import mongoose, { Document, Schema, Types } from 'mongoose';

export type PaymentMethod = 'cash' | 'upi' | 'bank' | 'cheque' | 'other';

export interface IPayment extends Document {
  invoiceId: Types.ObjectId;
  customerId: Types.ObjectId;
  driverId?: Types.ObjectId;
  collectionId?: Types.ObjectId;
  settlementId?: Types.ObjectId;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'Driver' },
    collectionId: { type: Schema.Types.ObjectId, ref: 'DriverCollection' },
    settlementId: { type: Schema.Types.ObjectId, ref: 'DriverDailySettlement' },
    amount: { type: Number, required: true, min: 0.01 },
    paymentDate: { type: Date, required: true, default: Date.now },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'bank', 'cheque', 'other'],
      required: true,
    },
    referenceNumber: { type: String, trim: true },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

paymentSchema.index({ customerId: 1, paymentDate: -1 });
paymentSchema.index({ paymentDate: -1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
