import { Delivery, Customer, Invoice, Area } from '../models';
import { startOfDay, endOfDay } from '../utils/date';

function getMonthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
  return { start, end };
}

function getYearRange(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 1);
  const end = endOfDay(new Date(date.getFullYear(), 11, 31));
  return { start, end };
}

async function sumBillableInRange(start: Date, end: Date) {
  const agg = await Delivery.aggregate([
    {
      $match: {
        status: 'delivered',
        deliveryDate: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$billableAmount' },
        totalDeliveries: { $sum: 1 },
        totalQuantity: { $sum: '$filledGiven' },
      },
    },
  ]);
  return agg[0] ?? { totalSales: 0, totalDeliveries: 0, totalQuantity: 0 };
}

export async function getSalesOverview() {
  const today = startOfDay();
  const todayEnd = endOfDay();
  const month = getMonthRange();
  const year = getYearRange();

  const [todayStats, monthStats, yearStats, pendingPayments, outstandingCoolers] =
    await Promise.all([
      sumBillableInRange(today, todayEnd),
      sumBillableInRange(month.start, month.end),
      sumBillableInRange(year.start, year.end),
      Invoice.aggregate([
        { $match: { status: { $in: ['pending', 'unpaid', 'partially_paid'] } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$amountDue', '$totalAmount'] } }, count: { $sum: 1 } } },
      ]),
      Customer.aggregate([
        { $match: { currentBalance: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$currentBalance' } } },
      ]),
    ]);

  return {
    today: todayStats,
    month: monthStats,
    year: yearStats,
    pendingPayments: pendingPayments[0] ?? { total: 0, count: 0 },
    outstandingCoolers: outstandingCoolers[0]?.total ?? 0,
  };
}

export async function getRevenueTrend(months = 6) {
  const results = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const range = getMonthRange(d);
    const stats = await sumBillableInRange(range.start, range.end);
    results.push({
      month: d.toLocaleString('en-IN', { month: 'short', year: 'numeric' }),
      revenue: stats.totalSales,
      deliveries: stats.totalDeliveries,
    });
  }
  return results;
}

export async function getTopCustomers(limit = 10) {
  return Delivery.aggregate([
    { $match: { status: 'delivered' } },
    {
      $group: {
        _id: '$customerId',
        totalQuantity: { $sum: '$filledGiven' },
        totalRevenue: { $sum: '$billableAmount' },
        deliveryCount: { $sum: 1 },
      },
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'customer',
      },
    },
    { $unwind: '$customer' },
    {
      $project: {
        customerId: '$_id',
        name: '$customer.name',
        shopName: '$customer.shopName',
        totalQuantity: 1,
        totalRevenue: 1,
        deliveryCount: 1,
      },
    },
  ]);
}

export async function getAreaWiseSales() {
  return Delivery.aggregate([
    { $match: { status: 'delivered' } },
    {
      $group: {
        _id: '$areaId',
        totalRevenue: { $sum: '$billableAmount' },
        totalDeliveries: { $sum: 1 },
        totalQuantity: { $sum: '$filledGiven' },
      },
    },
    {
      $lookup: { from: 'areas', localField: '_id', foreignField: '_id', as: 'area' },
    },
    { $unwind: '$area' },
    {
      $project: {
        areaId: '$_id',
        areaName: '$area.name',
        totalRevenue: 1,
        totalDeliveries: 1,
        totalQuantity: 1,
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);
}

export async function getDriverWiseSales() {
  return Delivery.aggregate([
    { $match: { status: 'delivered' } },
    {
      $group: {
        _id: '$driverId',
        totalRevenue: { $sum: '$billableAmount' },
        totalDeliveries: { $sum: 1 },
        totalQuantity: { $sum: '$filledGiven' },
      },
    },
    {
      $lookup: { from: 'drivers', localField: '_id', foreignField: '_id', as: 'driver' },
    },
    { $unwind: '$driver' },
    {
      $project: {
        driverId: '$_id',
        driverName: '$driver.name',
        totalRevenue: 1,
        totalDeliveries: 1,
        totalQuantity: 1,
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);
}
