import { Customer, Delivery, DriverAreaAssignment } from '../models';
import { Types } from 'mongoose';
import { ApiError } from '../utils/apiError';
import { parseDateOnly, startOfDay, endOfDay } from '../utils/date';
import { getCurrentPrice } from './pricing.service';
import { applyDeliveryInventoryDelta } from './inventory.service';
import { recordDeliveryCoolerTransactions } from './coolerTransaction.service';
import { validateDeliveryCredit } from './credit.service';
import { notDeletedFilter } from '../utils/softDelete';
import { withTransaction } from '../utils/transaction';

interface SaveDeliveryInput {
  customerId: string;
  driverId: string;
  userId: string;
  deliveryDate?: string | Date;
  status: 'delivered' | 'not_delivered';
  filledGiven?: number;
  emptyReturned?: number;
  remarks?: string;
}

export async function saveDelivery(input: SaveDeliveryInput) {
  return withTransaction(async (session) => {
    const deliveryDate = parseDateOnly(input.deliveryDate ?? new Date());

    const customer = await Customer.findOne({
      _id: input.customerId,
      ...notDeletedFilter(),
    }).session(session ?? null);
    if (!customer || customer.status !== 'active') {
      throw new ApiError(404, 'Customer not found or inactive');
    }

    const assignment = await DriverAreaAssignment.findOne({
      driverId: new Types.ObjectId(input.driverId),
      areaId: customer.areaId,
      isActive: true,
    }).session(session ?? null);
    if (!assignment) {
      throw new ApiError(403, 'Driver not assigned to customer area');
    }

    const filledGiven = input.status === 'delivered' ? (input.filledGiven ?? 1) : 0;
    const emptyReturned = input.status === 'delivered' ? (input.emptyReturned ?? 1) : 0;

    let unitPrice = 0;
    let billableAmount = 0;
    if (input.status === 'delivered') {
      unitPrice = customer.customPrice ?? (await getCurrentPrice());
      billableAmount = filledGiven * unitPrice;
    }

    const existing = await Delivery.findOne({
      customerId: customer._id,
      deliveryDate,
    }).session(session ?? null);

    const prevFilled = existing?.status === 'delivered' ? (existing?.filledGiven ?? 0) : 0;
    const prevReturned = existing?.status === 'delivered' ? (existing?.emptyReturned ?? 0) : 0;
    const prevBillable = existing?.status === 'delivered' ? (existing?.billableAmount ?? 0) : 0;
    const billableDelta = billableAmount - prevBillable;

    if (input.status === 'delivered' && billableDelta > 0) {
      const creditCheck = await validateDeliveryCredit(customer._id.toString(), billableDelta);
      if (!creditCheck.allowed) {
        throw new ApiError(402, creditCheck.message ?? 'Customer credit limit exceeded');
      }
    }

    let delivery;
    if (existing) {
      existing.status = input.status;
      existing.filledGiven = filledGiven;
      existing.emptyReturned = emptyReturned;
      existing.unitPrice = unitPrice;
      existing.billableAmount = billableAmount;
      existing.remarks = input.remarks;
      existing.deliveryTime = input.status === 'delivered' ? new Date() : undefined;
      existing.driverId = new Types.ObjectId(input.driverId);
      existing.updatedBy = new Types.ObjectId(input.userId);
      delivery = await existing.save(session ? { session } : undefined);
    } else {
      const [created] = await Delivery.create(
        [
          {
            customerId: customer._id,
            driverId: new Types.ObjectId(input.driverId),
            areaId: customer.areaId,
            deliveryDate,
            deliveryTime: input.status === 'delivered' ? new Date() : undefined,
            status: input.status,
            filledGiven,
            emptyReturned,
            unitPrice,
            billableAmount,
            remarks: input.remarks,
            createdBy: new Types.ObjectId(input.userId),
          },
        ],
        session ? { session } : undefined
      );
      delivery = created;
    }

    const newFilled = input.status === 'delivered' ? filledGiven : 0;
    const newReturned = input.status === 'delivered' ? emptyReturned : 0;
    const filledDelta = newFilled - prevFilled;
    const returnedDelta = newReturned - prevReturned;
    const isUpdate = !!existing;

    if (filledDelta !== 0 || returnedDelta !== 0) {
      customer.totalFilledGiven += filledDelta;
      customer.totalEmptyReturned += returnedDelta;
      customer.currentBalance = customer.totalFilledGiven - customer.totalEmptyReturned;
      if (input.status === 'delivered') {
        customer.lastDeliveryDate = deliveryDate;
      }
      await customer.save(session ? { session } : undefined);

      await applyDeliveryInventoryDelta(
        prevFilled,
        prevReturned,
        newFilled,
        newReturned,
        input.userId,
        delivery._id.toString()
      );

      await recordDeliveryCoolerTransactions({
        customerId: customer._id.toString(),
        driverId: input.driverId,
        deliveryId: delivery._id.toString(),
        areaId: customer.areaId.toString(),
        filledDelta,
        returnedDelta,
        userId: input.userId,
        isReversal: input.status !== 'delivered',
      });
    }

    // Invoice-only ledger model: deliveries do not post ledger entries (C1)

    return {
      delivery: await delivery.populate(['customerId', 'driverId', 'areaId']),
      isUpdate,
    };
  });
}

export async function getTodayDeliveriesForDriver(driverId: string, date?: Date) {
  const deliveryDate = startOfDay(date ?? new Date());

  const assignment = await DriverAreaAssignment.findOne({
    driverId: new Types.ObjectId(driverId),
    isActive: true,
  });
  if (!assignment) {
    throw new ApiError(404, 'No active area assignment for driver');
  }

  const customers = await Customer.find({
    areaId: assignment.areaId,
    status: 'active',
    ...notDeletedFilter(),
  })
    .populate('areaId', 'name')
    .sort({ shopName: 1 });

  const deliveries = await Delivery.find({
    driverId: new Types.ObjectId(driverId),
    deliveryDate,
  });

  const deliveryMap = new Map(deliveries.map((d) => [d.customerId.toString(), d]));

  return customers.map((customer) => ({
    customer,
    delivery: deliveryMap.get(customer._id.toString()) ?? null,
  }));
}

export async function getTodaySummary(driverId: string, date?: Date) {
  const deliveryDate = startOfDay(date ?? new Date());
  const deliveries = await Delivery.find({
    driverId: new Types.ObjectId(driverId),
    deliveryDate,
  });

  const delivered = deliveries.filter((d) => d.status === 'delivered').length;
  const notDelivered = deliveries.filter((d) => d.status === 'not_delivered').length;
  const totalFilled = deliveries.reduce((s, d) => s + d.filledGiven, 0);
  const totalReturned = deliveries.reduce((s, d) => s + d.emptyReturned, 0);
  const totalBillable = deliveries.reduce((s, d) => s + d.billableAmount, 0);

  const customerList = await getTodayDeliveriesForDriver(driverId, date);

  return {
    date: deliveryDate,
    totalCustomers: customerList.length,
    delivered,
    notDelivered,
    pending: customerList.length - delivered - notDelivered,
    totalFilled,
    totalReturned,
    totalBillable,
  };
}

export async function getDeliveryHistory(filters: {
  customerId?: string;
  driverId?: string;
  areaId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) {
  const query: Record<string, unknown> = {};
  if (filters.customerId) query.customerId = new Types.ObjectId(filters.customerId);
  if (filters.driverId) query.driverId = new Types.ObjectId(filters.driverId);
  if (filters.areaId) query.areaId = new Types.ObjectId(filters.areaId);
  if (filters.from || filters.to) {
    query.deliveryDate = {};
    if (filters.from) (query.deliveryDate as Record<string, Date>).$gte = parseDateOnly(filters.from);
    if (filters.to) (query.deliveryDate as Record<string, Date>).$lte = endOfDay(parseDateOnly(filters.to));
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 50;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Delivery.find(query)
      .populate('customerId', 'name shopName mobile')
      .populate('driverId', 'name')
      .populate('areaId', 'name')
      .sort({ deliveryDate: -1, deliveryTime: -1 })
      .skip(skip)
      .limit(limit),
    Delivery.countDocuments(query),
  ]);

  return { items, total, page, limit };
}
