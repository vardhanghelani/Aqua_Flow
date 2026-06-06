import mongoose, { Document, Schema, Types } from 'mongoose';

export type DeliveryStatus = 'delivered' | 'not_delivered';

export interface IDelivery extends Document {
  organizationId?: Types.ObjectId;
  customerId: Types.ObjectId;
  driverId: Types.ObjectId;
  areaId: Types.ObjectId;
  deliveryDate: Date;
  deliveryTime?: Date;
  status: DeliveryStatus;
  filledGiven: number;
  emptyReturned: number;
  unitPrice: number;
  billableAmount: number;
  remarks?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const deliverySchema = new Schema<IDelivery>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'Driver', required: true },
    areaId: { type: Schema.Types.ObjectId, ref: 'Area', required: true },
    deliveryDate: { type: Date, required: true },
    deliveryTime: { type: Date },
    status: { type: String, enum: ['delivered', 'not_delivered'], required: true },
    filledGiven: { type: Number, default: 0, min: 0 },
    emptyReturned: { type: Number, default: 0, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 },
    billableAmount: { type: Number, default: 0, min: 0 },
    remarks: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

deliverySchema.index({ customerId: 1, deliveryDate: 1 }, { unique: true });
deliverySchema.index({ driverId: 1, deliveryDate: 1 });
deliverySchema.index({ areaId: 1, deliveryDate: 1 });
deliverySchema.index({ deliveryDate: 1 });
deliverySchema.index({ status: 1, deliveryDate: 1 });
deliverySchema.index({ customerId: 1, status: 1, deliveryDate: 1 });

export const Delivery = mongoose.model<IDelivery>('Delivery', deliverySchema);
