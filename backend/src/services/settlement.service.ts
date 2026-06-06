import { Types } from 'mongoose';
import { Delivery, DriverDailySettlement, DriverCollection, CoolerTransaction } from '../models';
import { ApiError } from '../utils/apiError';
import { parseDateOnly, startOfDay, endOfDay } from '../utils/date';
import { assertDriverInOrg, assertSettlementInOrg, tenantFilter } from '../utils/tenant';

function calcExpectedClosing(s: {
  openingStock: number;
  deliveriesMade: number;
  emptyReturns: number;
  damagedCoolers: number;
  lostCoolers: number;
}) {
  return s.openingStock - s.deliveriesMade + s.emptyReturns - s.damagedCoolers - s.lostCoolers;
}

export async function autoPopulateFromDeliveries(driverId: string, settlementDate: Date) {
  const dayStart = startOfDay(settlementDate);
  const dayEnd = endOfDay(settlementDate);

  const deliveries = await Delivery.find({
    driverId: new Types.ObjectId(driverId),
    deliveryDate: { $gte: dayStart, $lte: dayEnd },
    status: 'delivered',
  });

  const deliveriesMade = deliveries.reduce((s, d) => s + d.filledGiven, 0);
  const emptyReturns = deliveries.reduce((s, d) => s + d.emptyReturned, 0);

  const damageLoss = await CoolerTransaction.aggregate([
    {
      $match: {
        driverId: new Types.ObjectId(driverId),
        createdAt: { $gte: dayStart, $lte: dayEnd },
        type: { $in: ['damaged', 'lost'] },
      },
    },
    { $group: { _id: '$type', total: { $sum: '$quantity' } } },
  ]);

  return {
    deliveriesMade,
    emptyReturns,
    damagedCoolers: damageLoss.find((d) => d._id === 'damaged')?.total ?? 0,
    lostCoolers: damageLoss.find((d) => d._id === 'lost')?.total ?? 0,
  };
}

export async function upsertSettlement(input: {
  organizationId: string;
  driverId: string;
  settlementDate: string | Date;
  openingStock?: number;
  deliveriesMade?: number;
  emptyReturns?: number;
  damagedCoolers?: number;
  lostCoolers?: number;
  closingStock?: number;
  cashCollected?: number;
  notes?: string;
  areaId?: string;
  userId: string;
}) {
  await assertDriverInOrg(input.driverId, input.organizationId);
  const settlementDate = parseDateOnly(input.settlementDate);
  const existing = await DriverDailySettlement.findOne({
    ...tenantFilter(input.organizationId, {
      driverId: new Types.ObjectId(input.driverId),
      settlementDate,
    }),
  });

  if (existing && !['draft', 'rejected'].includes(existing.status)) {
    throw new ApiError(400, `Settlement is ${existing.status} and cannot be edited`);
  }

  const auto = await autoPopulateFromDeliveries(input.driverId, settlementDate);
  const openingStock = input.openingStock ?? existing?.openingStock ?? 0;
  const deliveriesMade = input.deliveriesMade ?? auto.deliveriesMade;
  const emptyReturns = input.emptyReturns ?? auto.emptyReturns;
  const damagedCoolers = input.damagedCoolers ?? existing?.damagedCoolers ?? auto.damagedCoolers;
  const lostCoolers = input.lostCoolers ?? existing?.lostCoolers ?? auto.lostCoolers;
  const expectedClosing = calcExpectedClosing({
    openingStock,
    deliveriesMade,
    emptyReturns,
    damagedCoolers,
    lostCoolers,
  });
  const closingStock = input.closingStock ?? existing?.closingStock ?? expectedClosing;
  const variance = closingStock - expectedClosing;

  const cashAgg = await DriverCollection.aggregate([
    {
      $match: {
        driverId: new Types.ObjectId(input.driverId),
        collectionDate: { $gte: startOfDay(settlementDate), $lte: endOfDay(settlementDate) },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const payload = {
    driverId: new Types.ObjectId(input.driverId),
    areaId: input.areaId ? new Types.ObjectId(input.areaId) : undefined,
    settlementDate,
    openingStock,
    deliveriesMade,
    emptyReturns,
    damagedCoolers,
    lostCoolers,
    closingStock,
    expectedClosing,
    variance,
    cashCollected: input.cashCollected ?? cashAgg[0]?.total ?? existing?.cashCollected ?? 0,
    notes: input.notes,
    status: 'draft' as const,
    updatedBy: new Types.ObjectId(input.userId),
  };

  if (existing) {
    Object.assign(existing, payload);
    return existing.save();
  }

  return DriverDailySettlement.create({
    ...payload,
    organizationId: new Types.ObjectId(input.organizationId),
    createdBy: new Types.ObjectId(input.userId),
  });
}

export async function submitSettlement(id: string, userId: string, organizationId: string) {
  const settlement = await assertSettlementInOrg(id, organizationId);
  if (!['draft', 'rejected'].includes(settlement.status)) {
    throw new ApiError(400, 'Settlement cannot be submitted');
  }
  settlement.status = 'submitted';
  settlement.submittedAt = new Date();
  settlement.updatedBy = new Types.ObjectId(userId);
  return settlement.save();
}

export async function approveSettlement(id: string, userId: string, organizationId: string) {
  const settlement = await assertSettlementInOrg(id, organizationId);
  if (settlement.status !== 'submitted') throw new ApiError(400, 'Only submitted settlements can be approved');
  settlement.status = 'approved';
  settlement.approvedBy = new Types.ObjectId(userId);
  settlement.approvedAt = new Date();
  settlement.updatedBy = new Types.ObjectId(userId);
  return settlement.save();
}

export async function rejectSettlement(id: string, userId: string, organizationId: string, reason?: string) {
  const settlement = await assertSettlementInOrg(id, organizationId);
  if (settlement.status !== 'submitted') throw new ApiError(400, 'Only submitted settlements can be rejected');
  settlement.status = 'rejected';
  settlement.rejectedReason = reason;
  settlement.updatedBy = new Types.ObjectId(userId);
  return settlement.save();
}

export async function listSettlements(filters: {
  organizationId: string;
  driverId?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) {
  const query: Record<string, unknown> = tenantFilter(filters.organizationId);
  if (filters.driverId) query.driverId = new Types.ObjectId(filters.driverId);
  if (filters.status) query.status = filters.status;
  if (filters.from || filters.to) {
    query.settlementDate = {};
    if (filters.from) (query.settlementDate as Record<string, Date>).$gte = parseDateOnly(filters.from);
    if (filters.to) (query.settlementDate as Record<string, Date>).$lte = endOfDay(parseDateOnly(filters.to));
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 50;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    DriverDailySettlement.find(query)
      .populate('driverId', 'name mobile')
      .populate('approvedBy', 'name')
      .sort({ settlementDate: -1 })
      .skip(skip)
      .limit(limit),
    DriverDailySettlement.countDocuments(query),
  ]);

  return { items, total, page, limit };
}

export async function getSettlementById(id: string, organizationId: string) {
  const settlement = await DriverDailySettlement.findOne(tenantFilter(organizationId, { _id: id }))
    .populate('driverId', 'name mobile')
    .populate('approvedBy', 'name');
  if (!settlement) throw new ApiError(404, 'Settlement not found');
  return settlement;
}
