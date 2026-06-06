import mongoose, { Document, Schema, Types } from 'mongoose';

export type LedgerEntryType =
  | 'delivery_charge'
  | 'invoice'
  | 'payment'
  | 'adjustment'
  | 'credit'
  | 'debit'
  | 'reversal'
  | 'invoice_void';

export interface ILedgerEntry extends Document {
  organizationId?: Types.ObjectId;
  customerId: Types.ObjectId;
  date: Date;
  particular: string;
  entryType: LedgerEntryType;
  debit: number;
  credit: number;
  balance: number;
  referenceType?: string;
  referenceId?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  createdAt: Date;
}

const ledgerEntrySchema = new Schema<ILedgerEntry>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    date: { type: Date, required: true },
    particular: { type: String, required: true, trim: true },
    entryType: {
      type: String,
      enum: ['delivery_charge', 'invoice', 'payment', 'adjustment', 'credit', 'debit', 'reversal', 'invoice_void'],
      required: true,
    },
    debit: { type: Number, default: 0, min: 0 },
    credit: { type: Number, default: 0, min: 0 },
    balance: { type: Number, required: true },
    referenceType: { type: String },
    referenceId: { type: Schema.Types.ObjectId },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ledgerEntrySchema.index({ customerId: 1, date: -1 });
ledgerEntrySchema.index({ customerId: 1, createdAt: -1 });

export const LedgerEntry = mongoose.model<ILedgerEntry>('LedgerEntry', ledgerEntrySchema);
