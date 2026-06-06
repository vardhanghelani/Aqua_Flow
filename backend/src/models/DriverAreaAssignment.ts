import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDriverAreaAssignment extends Document {
  organizationId?: Types.ObjectId;
  driverId: Types.ObjectId;
  areaId: Types.ObjectId;
  assignedBy: Types.ObjectId;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IDriverAreaAssignment>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'Driver', required: true, index: true },
    areaId: { type: Schema.Types.ObjectId, ref: 'Area', required: true, index: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

assignmentSchema.index({ areaId: 1, isActive: 1 });
assignmentSchema.index({ driverId: 1, isActive: 1 });

export const DriverAreaAssignment = mongoose.model<IDriverAreaAssignment>(
  'DriverAreaAssignment',
  assignmentSchema
);
