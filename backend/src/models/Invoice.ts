import mongoose, { Document, Schema, Types } from 'mongoose';

export type InvoiceType = 'monthly' | 'weekly' | 'custom';
export type InvoiceStatus = 'pending' | 'unpaid' | 'partially_paid' | 'paid' | 'void';

export interface IInvoiceItem {
  deliveryId: Types.ObjectId;
  date: Date;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  customerId: Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  invoiceType: InvoiceType;
  items: IInvoiceItem[];
  totalQuantity: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  status: InvoiceStatus;
  dueDate?: Date;
  generatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceItemSchema = new Schema<IInvoiceItem>(
  {
    deliveryId: { type: Schema.Types.ObjectId, ref: 'Delivery', required: true },
    date: { type: Date, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    invoiceType: { type: String, enum: ['monthly', 'weekly', 'custom'], required: true },
    items: [invoiceItemSchema],
    totalQuantity: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    amountDue: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'unpaid', 'partially_paid', 'paid', 'void'],
      default: 'unpaid',
    },
    dueDate: { type: Date },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

invoiceSchema.index({ customerId: 1, periodStart: 1, periodEnd: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ dueDate: 1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);
