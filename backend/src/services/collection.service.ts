import { Types } from 'mongoose';
import { DriverCollection, Payment } from '../models';
import { CollectionPaymentMethod } from '../models/DriverCollection';
import { ApiError } from '../utils/apiError';
import { parseDateOnly, endOfDay } from '../utils/date';
import { recordPayment } from './payment.service';

export async function recordCollection(input: {
  driverId: string;
  customerId?: string;
  invoiceId?: string;
  amount: number;
  paymentMethod: CollectionPaymentMethod;
  collectionDate?: string | Date;
  referenceNumber?: string;
  notes?: string;
  settlementId?: string;
  userId: string;
  createPayment?: boolean;
}) {
  const collection = await DriverCollection.create({
    driverId: new Types.ObjectId(input.driverId),
    customerId: input.customerId ? new Types.ObjectId(input.customerId) : undefined,
    invoiceId: input.invoiceId ? new Types.ObjectId(input.invoiceId) : undefined,
    settlementId: input.settlementId ? new Types.ObjectId(input.settlementId) : undefined,
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    collectionDate: input.collectionDate ? new Date(input.collectionDate) : new Date(),
    referenceNumber: input.referenceNumber,
    notes: input.notes,
    createdBy: new Types.ObjectId(input.userId),
  });

  if (input.createPayment && input.invoiceId) {
    const payment = await recordPayment({
      invoiceId: input.invoiceId,
      amount: input.amount,
      paymentDate: collection.collectionDate,
      paymentMethod:
        input.paymentMethod === 'cheque' ? 'cheque'
        : input.paymentMethod === 'upi' ? 'upi'
        : input.paymentMethod === 'bank' ? 'bank'
        : input.paymentMethod === 'other' ? 'other'
        : 'cash',
      referenceNumber: input.referenceNumber,
      notes: input.notes,
      userId: input.userId,
      driverId: input.driverId,
      collectionId: collection._id.toString(),
      settlementId: input.settlementId,
    });
    collection.paymentId = payment._id;
    await collection.save();
  }

  return collection.populate(['driverId', 'customerId', 'invoiceId']);
}

export async function reconcileCollection(id: string, userId: string) {
  const collection = await DriverCollection.findById(id);
  if (!collection) throw new ApiError(404, 'Collection not found');
  if (collection.reconciled) throw new ApiError(400, 'Already reconciled');
  collection.reconciled = true;
  collection.reconciledAt = new Date();
  collection.reconciledBy = new Types.ObjectId(userId);
  return collection.save();
}

export async function listCollections(filters: {
  driverId?: string;
  customerId?: string;
  reconciled?: boolean;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) {
  const query: Record<string, unknown> = {};
  if (filters.driverId) query.driverId = new Types.ObjectId(filters.driverId);
  if (filters.customerId) query.customerId = new Types.ObjectId(filters.customerId);
  if (filters.reconciled !== undefined) query.reconciled = filters.reconciled;
  if (filters.from || filters.to) {
    query.collectionDate = {};
    if (filters.from) (query.collectionDate as Record<string, Date>).$gte = parseDateOnly(filters.from);
    if (filters.to) (query.collectionDate as Record<string, Date>).$lte = endOfDay(parseDateOnly(filters.to));
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 50;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    DriverCollection.find(query)
      .populate('driverId', 'name')
      .populate('customerId', 'shopName name')
      .populate('invoiceId', 'invoiceNumber')
      .sort({ collectionDate: -1 })
      .skip(skip)
      .limit(limit),
    DriverCollection.countDocuments(query),
  ]);

  return { items, total, page, limit };
}

export async function getCollectionReport(filters: { from?: string; to?: string; driverId?: string }) {
  const match: Record<string, unknown> = {};
  if (filters.driverId) match.driverId = new Types.ObjectId(filters.driverId);
  if (filters.from || filters.to) {
    match.collectionDate = {};
    if (filters.from) (match.collectionDate as Record<string, Date>).$gte = parseDateOnly(filters.from);
    if (filters.to) (match.collectionDate as Record<string, Date>).$lte = endOfDay(parseDateOnly(filters.to));
  }

  const [byMethod, byDriver, totals] = await Promise.all([
    DriverCollection.aggregate([
      { $match: match },
      { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    DriverCollection.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$driverId',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          reconciled: { $sum: { $cond: ['$reconciled', 1, 0] } },
        },
      },
      { $lookup: { from: 'drivers', localField: '_id', foreignField: '_id', as: 'driver' } },
      { $unwind: { path: '$driver', preserveNullAndEmptyArrays: true } },
      { $project: { driverName: '$driver.name', total: 1, count: 1, reconciled: 1 } },
    ]),
    DriverCollection.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          unreconciled: { $sum: { $cond: ['$reconciled', 0, 1] } },
        },
      },
    ]),
  ]);

  return {
    byMethod,
    byDriver,
    summary: totals[0] ?? { total: 0, count: 0, unreconciled: 0 },
  };
}
