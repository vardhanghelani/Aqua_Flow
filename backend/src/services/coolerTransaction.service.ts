import { CoolerTransaction, Customer } from '../models';
import { CoolerTransactionType } from '../models/CoolerTransaction';
import { Types } from 'mongoose';
import { ApiError } from '../utils/apiError';
import { assertCustomerInOrg, tenantFilter } from '../utils/tenant';

interface CreateCoolerTransactionInput {
  organizationId: string;
  customerId: string;
  type: CoolerTransactionType;
  quantity: number;
  driverId?: string;
  deliveryId?: string;
  areaId?: string;
  notes?: string;
  reference?: string;
  userId: string;
}

export async function createCoolerTransaction(input: CreateCoolerTransactionInput) {
  const customer = await assertCustomerInOrg(input.customerId, input.organizationId);

  const txn = await CoolerTransaction.create({
    organizationId: customer.organizationId,
    customerId: customer._id,
    driverId: input.driverId ? new Types.ObjectId(input.driverId) : undefined,
    deliveryId: input.deliveryId ? new Types.ObjectId(input.deliveryId) : undefined,
    areaId: input.areaId ? new Types.ObjectId(input.areaId) : customer.areaId,
    type: input.type,
    quantity: input.quantity,
    notes: input.notes,
    reference: input.reference,
    createdBy: new Types.ObjectId(input.userId),
  });

  if (input.type === 'lost') {
    customer.totalLost += input.quantity;
  } else if (input.type === 'damaged') {
    customer.totalDamaged += input.quantity;
  } else if (input.type === 'replaced') {
    customer.totalFilledGiven += input.quantity;
    customer.currentBalance = customer.totalFilledGiven - customer.totalEmptyReturned;
  }

  if (['lost', 'damaged', 'replaced'].includes(input.type)) {
    await customer.save();
  }

  return txn.populate(['customerId', 'driverId', 'areaId']);
}

export async function recordDeliveryCoolerTransactions(params: {
  organizationId: string;
  customerId: string;
  driverId: string;
  deliveryId: string;
  areaId: string;
  filledDelta: number;
  returnedDelta: number;
  userId: string;
  isReversal?: boolean;
}) {
  const { organizationId, customerId, driverId, deliveryId, areaId, filledDelta, returnedDelta, userId, isReversal } =
    params;
  const orgOid = new Types.ObjectId(organizationId);
  const transactions = [];

  if (filledDelta !== 0) {
    const qty = Math.abs(filledDelta);
    const type: CoolerTransactionType = isReversal || filledDelta < 0 ? 'adjustment' : 'delivered';
    transactions.push(
      await CoolerTransaction.create({
        organizationId: orgOid,
        customerId: new Types.ObjectId(customerId),
        driverId: new Types.ObjectId(driverId),
        deliveryId: new Types.ObjectId(deliveryId),
        areaId: new Types.ObjectId(areaId),
        type,
        quantity: qty,
        notes: isReversal ? 'Delivery reversal' : 'Delivery — filled coolers given',
        createdBy: new Types.ObjectId(userId),
      })
    );
  }

  if (returnedDelta !== 0) {
    const qty = Math.abs(returnedDelta);
    transactions.push(
      await CoolerTransaction.create({
        organizationId: orgOid,
        customerId: new Types.ObjectId(customerId),
        driverId: new Types.ObjectId(driverId),
        deliveryId: new Types.ObjectId(deliveryId),
        areaId: new Types.ObjectId(areaId),
        type: 'returned',
        quantity: qty,
        notes: returnedDelta < 0 ? 'Return reversal' : 'Delivery — empty coolers returned',
        createdBy: new Types.ObjectId(userId),
      })
    );
  }

  return transactions;
}

export async function listCoolerTransactions(filters: {
  organizationId: string;
  customerId?: string;
  type?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) {
  const query: Record<string, unknown> = tenantFilter(filters.organizationId);
  if (filters.customerId) query.customerId = new Types.ObjectId(filters.customerId);
  if (filters.type) query.type = filters.type;
  if (filters.from || filters.to) {
    query.createdAt = {};
    if (filters.from) (query.createdAt as Record<string, Date>).$gte = new Date(filters.from);
    if (filters.to) (query.createdAt as Record<string, Date>).$lte = new Date(filters.to);
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 50;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    CoolerTransaction.find(query)
      .populate('customerId', 'name shopName')
      .populate('driverId', 'name')
      .populate('areaId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    CoolerTransaction.countDocuments(query),
  ]);

  return { items, total, page, limit };
}

export async function getCoolerSummary(organizationId: string) {
  if (!organizationId) throw new ApiError(403, 'Organization context required');
  const orgMatch = tenantFilter(organizationId);
  const agg = await CoolerTransaction.aggregate([
    { $match: orgMatch },
    {
      $group: {
        _id: '$type',
        totalQuantity: { $sum: '$quantity' },
        count: { $sum: 1 },
      },
    },
  ]);

  const customerAgg = await Customer.aggregate([
    { $match: orgMatch },
    {
      $group: {
        _id: null,
        totalLost: { $sum: '$totalLost' },
        totalDamaged: { $sum: '$totalDamaged' },
      },
    },
  ]);

  return {
    byType: agg,
    totalLost: customerAgg[0]?.totalLost ?? 0,
    totalDamaged: customerAgg[0]?.totalDamaged ?? 0,
  };
}
