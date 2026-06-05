import mongoose, { Document, Schema, Types } from 'mongoose';
import { softDeleteFields } from '../utils/softDelete';

export interface IDriver extends Document {
  userId?: Types.ObjectId;
  name: string;
  mobile: string;
  isActive: boolean;
  organizationId?: Types.ObjectId;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const driverSchema = new Schema<IDriver>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    ...softDeleteFields,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Driver = mongoose.model<IDriver>('Driver', driverSchema);
