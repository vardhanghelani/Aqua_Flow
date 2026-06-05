import { Types } from 'mongoose';
import {
  Delivery,
  Driver,
  DriverCollection,
  DriverDailySettlement,
  CoolerTransaction,
} from '../models';
import { ApiError } from '../utils/apiError';
import { parseDateOnly, startOfDay, endOfDay } from '../utils/date';

function scoreDelivery(delivered: number, total: number) {
  if (total === 0) return 100;
  return Math.round((delivered / total) * 100);
}

function scoreCollection(collected: number, expected: number) {
  if (expected <= 0) return collected > 0 ? 100 : 80;
  return Math.min(100, Math.round((collected / expected) * 100));
}

function scoreAttendance(daysWorked: number, workingDays: number) {
  if (workingDays === 0) return 100;
  return Math.round((daysWorked / workingDays) * 100);
}

export async function computeDriverPerformance(
  driverId: string,
  filters?: { from?: string; to?: string; month?: string }
) {
  const driver = await Driver.findById(driverId);
  if (!driver) throw new ApiError(404, 'Driver not found');

  let from: Date;
  let to: Date;

  if (filters?.month) {
    const [y, m] = filters.month.split('-').map(Number);
    from = new Date(y, m - 1, 1);
    to = endOfDay(new Date(y, m, 0));
  } else {
    from = filters?.from ? parseDateOnly(filters.from) : startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    to = filters?.to ? endOfDay(parseDateOnly(filters.to)) : endOfDay(new Date());
  }

  const driverOid = new Types.ObjectId(driverId);
  const dateRange = { $gte: from, $lte: to };

  const [deliveries, collections, settlements, damageLoss] = await Promise.all([
    Delivery.find({ driverId: driverOid, deliveryDate: dateRange }),
    DriverCollection.aggregate([
      { $match: { driverId: driverOid, collectionDate: dateRange } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    DriverDailySettlement.find({ driverId: driverOid, settlementDate: dateRange, status: 'approved' }),
    CoolerTransaction.aggregate([
      {
        $match: {
          driverId: driverOid,
          createdAt: dateRange,
          type: { $in: ['damaged', 'lost'] },
        },
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: '$quantity' },
        },
      },
    ]),
  ]);

  const delivered = deliveries.filter((d) => d.status === 'delivered').length;
  const notDelivered = deliveries.filter((d) => d.status === 'not_delivered').length;
  const totalAttempts = delivered + notDelivered;
  const totalBillable = deliveries.reduce((s, d) => s + d.billableAmount, 0);
  const totalCollected = collections[0]?.total ?? 0;

  const damaged = damageLoss.find((d) => d._id === 'damaged')?.count ?? 0;
  const lost = damageLoss.find((d) => d._id === 'lost')?.count ?? 0;
  const penaltyUnits = damaged + lost;

  const deliveryScore = scoreDelivery(delivered, totalAttempts);
  const collectionScore = scoreCollection(totalCollected, totalBillable);
  const workingDays = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
  const daysWorked = new Set(deliveries.map((d) => d.deliveryDate.toISOString().slice(0, 10))).size;
  const attendanceScore = scoreAttendance(daysWorked, workingDays);
  const damagePenalty = Math.max(0, 100 - penaltyUnits * 5);
  const overallScore = Math.round(
    deliveryScore * 0.35 + collectionScore * 0.3 + attendanceScore * 0.2 + damagePenalty * 0.15
  );

  return {
    driver: { id: driver._id, name: driver.name, mobile: driver.mobile },
    period: { from, to },
    metrics: {
      deliveriesAttempted: totalAttempts,
      deliveriesCompleted: delivered,
      totalBillable,
      totalCollected,
      collectionsCount: collections[0]?.count ?? 0,
      settlementsApproved: settlements.length,
      damagedCoolers: damaged,
      lostCoolers: lost,
      daysWorked,
      workingDays,
    },
    scores: {
      delivery: deliveryScore,
      collection: collectionScore,
      attendance: attendanceScore,
      damagePenalty,
      overall: overallScore,
    },
    grade:
      overallScore >= 90 ? 'A' : overallScore >= 75 ? 'B' : overallScore >= 60 ? 'C' : overallScore >= 40 ? 'D' : 'F',
  };
}
