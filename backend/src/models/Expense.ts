import mongoose, { Document, Schema, Types } from 'mongoose';

export type ExpenseCategory = 'diesel' | 'salary' | 'maintenance' | 'office' | 'other';

export interface IExpense extends Document {
  category: ExpenseCategory;
  description: string;
  amount: number;
  expenseDate: Date;
  referenceNumber?: string;
  notes?: string;
  organizationId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    category: { type: String, enum: ['diesel', 'salary', 'maintenance', 'office', 'other'], required: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    expenseDate: { type: Date, required: true, default: Date.now },
    referenceNumber: { type: String, trim: true },
    notes: { type: String, trim: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

expenseSchema.index({ expenseDate: -1 });
expenseSchema.index({ category: 1, expenseDate: -1 });

export const Expense = mongoose.model<IExpense>('Expense', expenseSchema);
