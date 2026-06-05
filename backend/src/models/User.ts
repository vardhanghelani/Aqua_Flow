import mongoose, { Document, Schema, Types } from 'mongoose';
import { UserRole } from '../types';

export interface IUser extends Document {
  name: string;
  loginId: string;
  password: string;
  role: UserRole;
  driverProfile?: Types.ObjectId;
  isActive: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    loginId: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['owner', 'driver'], required: true },
    driverProfile: { type: Schema.Types.ObjectId, ref: 'Driver' },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
