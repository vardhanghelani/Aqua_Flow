import { Customer, Delivery, Driver, DriverAreaAssignment, Area, Invoice, Payment } from '../models';
import { getInventorySnapshot } from './inventory.service';
import { getPaymentSummary } from './payment.service';
import { Types } from 'mongoose';
import { startOfDay } from '../utils/date';
import { tenantFilter } from '../utils/tenant';

export async function getCustomerReports(organizationId: string) {
  const orgId = new Types.ObjectId(organizationId);
  const customers = await Customer.find({ organizationId: orgId }).populate('areaId', 'name').lean();

  const deliveryStats = await Delivery.aggregate([
    { $match: { organizationId: orgId, status: 'delivered' } },
    {
      $group: {
        _id: '$customerId',
        totalDeliveries: { $sum: 1 },
        totalQuantity: { $sum: '$filledGiven' },
        totalRevenue: { $sum: '$billableAmount' },
        lastDelivery: { $max: '$deliveryDate' },
      },
    },
  ]);

  const outstandingAgg = await Invoice.aggregate([
    { $match: { organizationId: orgId, status: { $in: ['unpaid', 'partially_paid', 'pending'] } } },
    { $group: { _id: '$customerId', outstanding: { $sum: { $ifNull: ['$amountDue', '$totalAmount'] } } } },
  ]);
  const outstandingMap = new Map(outstandingAgg.map((o) => [o._id.toString(), o.outstanding]));

  const statsMap = new Map(deliveryStats.map((s) => [s._id.toString(), s]));

  return customers.map((c) => {
    const stats = statsMap.get(c._id.toString());
    const daysSinceLast =
      c.lastDeliveryDate
        ? Math.floor((Date.now() - new Date(c.lastDeliveryDate).getTime()) / 86400000)
        : null;

    let purchaseFrequency = 'Unknown';
    if (stats && stats.totalDeliveries > 0 && c.createdAt) {
      const daysActive = Math.max(
        1,
        Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 86400000)
      );
      const avgDays = daysActive / stats.totalDeliveries;
      if (avgDays <= 1.5) purchaseFrequency = 'Daily';
      else if (avgDays <= 3.5) purchaseFrequency = 'Every 2-3 days';
      else if (avgDays <= 8) purchaseFrequency = 'Weekly';
      else purchaseFrequency = 'Occasional';
    }

    return {
      customerId: c._id,
      name: c.name,
      shopName: c.shopName,
      area: (c.areaId as { name?: string })?.name,
      totalDeliveries: stats?.totalDeliveries ?? 0,
      totalQuantity: stats?.totalQuantity ?? 0,
      currentCoolerBalance: c.currentBalance,
      totalRevenue: stats?.totalRevenue ?? 0,
      outstandingAmount: outstandingMap.get(c._id.toString()) ?? 0,
      purchaseFrequency,
      lastDeliveryDate: c.lastDeliveryDate ?? stats?.lastDelivery,
      daysSinceLastDelivery: daysSinceLast,
      analyticsStatus: c.analyticsStatus ?? 'active',
      lostCoolers: c.totalLost ?? 0,
      damagedCoolers: c.totalDamaged ?? 0,
      status: c.status,
    };
  });
}

export async function getAreaReports(organizationId: string) {
  const orgId = new Types.ObjectId(organizationId);
  const areas = await Area.find({ organizationId: orgId, isActive: true }).lean();
  const results = [];

  for (const area of areas) {
    const [customerCount, assignment, deliveryStats, coolerStats] = await Promise.all([
      Customer.countDocuments({ areaId: area._id, status: 'active' }),
      DriverAreaAssignment.findOne({ areaId: area._id, isActive: true }).populate(
        'driverId',
        'name'
      ),
      Delivery.aggregate([
        { $match: { areaId: area._id, status: 'delivered' } },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$billableAmount' },
            deliveries: { $sum: 1 },
          },
        },
      ]),
      Customer.aggregate([
        { $match: { areaId: area._id } },
        { $group: { _id: null, coolers: { $sum: '$currentBalance' } } },
      ]),
    ]);

    results.push({
      areaId: area._id,
      areaName: area.name,
      customers: customerCount,
      revenue: deliveryStats[0]?.revenue ?? 0,
      deliveries: deliveryStats[0]?.deliveries ?? 0,
      assignedDriver: (assignment?.driverId as { name?: string })?.name ?? 'Unassigned',
      coolersCirculating: coolerStats[0]?.coolers ?? 0,
    });
  }

  return results;
}

export async function getDriverReports(organizationId: string) {
  const orgId = new Types.ObjectId(organizationId);
  const drivers = await Driver.find({ organizationId: orgId, isActive: true }).lean();
  const results = [];

  for (const driver of drivers) {
    const [deliveryStats, areasServed, todayActivity] = await Promise.all([
      Delivery.aggregate([
        { $match: { driverId: driver._id, status: 'delivered' } },
        {
          $group: {
            _id: null,
            totalDeliveries: { $sum: 1 },
            totalQuantity: { $sum: '$filledGiven' },
            totalRevenue: { $sum: '$billableAmount' },
          },
        },
      ]),
      DriverAreaAssignment.find({ driverId: driver._id })
        .populate('areaId', 'name')
        .sort({ startDate: -1 }),
      Delivery.countDocuments({
        driverId: driver._id,
        deliveryDate: startOfDay(),
        status: 'delivered',
      }),
    ]);

    const uniqueCustomers = await Delivery.distinct('customerId', {
      driverId: driver._id,
      status: 'delivered',
    });

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthlyDeliveries = await Delivery.countDocuments({
      driverId: driver._id,
      status: 'delivered',
      deliveryDate: { $gte: monthStart },
    });

    results.push({
      driverId: driver._id,
      driverName: driver.name,
      mobile: driver.mobile,
      totalDeliveries: deliveryStats[0]?.totalDeliveries ?? 0,
      totalQuantity: deliveryStats[0]?.totalQuantity ?? 0,
      totalRevenue: deliveryStats[0]?.totalRevenue ?? 0,
      customersCovered: uniqueCustomers.length,
      todayDeliveries: todayActivity,
      monthlyDeliveries,
      areasServed: areasServed.map((a) => ({
        area: (a.areaId as { name?: string })?.name,
        startDate: a.startDate,
        endDate: a.endDate,
        isActive: a.isActive,
      })),
    });
  }

  return results;
}

export async function getPaymentReports(organizationId: string, from?: string, to?: string) {
  if (!organizationId) throw new Error('Organization context required');
  const orgMatch = tenantFilter(organizationId);
  const query: Record<string, unknown> = { ...orgMatch };
  if (from || to) {
    query.paymentDate = {};
    if (from) (query.paymentDate as Record<string, Date>).$gte = new Date(from);
    if (to) (query.paymentDate as Record<string, Date>).$lte = new Date(to);
  }

  const [payments, summary] = await Promise.all([
    Payment.find(query)
      .populate('customerId', 'shopName')
      .populate('invoiceId', 'invoiceNumber')
      .sort({ paymentDate: -1 }),
    getPaymentSummary(organizationId),
  ]);

  return { payments, summary };
}

export async function getInventoryReports(organizationId: string) {
  const { reconcileInventory } = await import('./inventory.service');
  const [snapshot, reconcile] = await Promise.all([
    getInventorySnapshot(organizationId),
    reconcileInventory(organizationId),
  ]);
  return { snapshot, reconcile };
}
