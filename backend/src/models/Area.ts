import mongoose, { Document, Schema, Types } from 'mongoose';
import { softDeleteFields } from '../utils/softDelete';

export interface IArea extends Document {
  name: string;
  description?: string;
  isActive: boolean;
  organizationId?: Types.ObjectId;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const areaSchema = new Schema<IArea>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    ...softDeleteFields,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Area = mongoose.model<IArea>('Area', areaSchema);
