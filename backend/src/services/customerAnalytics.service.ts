import { Customer, Delivery, Invoice, CoolerTransaction } from '../models';
import { AnalyticsSettings } from '../models/AnalyticsSettings';
import { Types } from 'mongoose';
import { startOfDay } from '../utils/date';
import { tenantFilter, tenantObjectId } from '../utils/tenant';

export async function getAnalyticsSettings(organizationId: string) {
  let settings = await AnalyticsSettings.findOne({ organizationId: new Types.ObjectId(organizationId) });
  if (!settings) {
    settings = await AnalyticsSettings.create({ organizationId: new Types.ObjectId(organizationId) });
  }
  return settings;
}

export async function updateAnalyticsSettings(
  organizationId: string,
  data: Partial<{
  inactiveDaysThreshold: number;
  atRiskDaysThreshold: number;
  excessiveCoolerThreshold: number;
  lowWarehouseThreshold: number;
  unservicedDaysThreshold: number;
}>) {
  const settings = await getAnalyticsSettings(organizationId);
  Object.assign(settings, data);
  await settings.save();
  return settings;
}

export function classifyCustomerStatus(
  lastDeliveryDate: Date | undefined,
  customerStatus: string,
  rules: { inactiveDaysThreshold: number; atRiskDaysThreshold: number }
): 'active' | 'at_risk' | 'inactive' {
  if (customerStatus === 'inactive') return 'inactive';
  if (!lastDeliveryDate) return 'inactive';

  const daysSince = Math.floor((Date.now() - lastDeliveryDate.getTime()) / 86400000);
  if (daysSince >= rules.inactiveDaysThreshold) return 'inactive';
  if (daysSince >= rules.atRiskDaysThreshold) return 'at_risk';
  return 'active';
}

export async function computeCustomerAnalytics(customerId: string, organizationId: string) {
  const customer = await Customer.findOne(tenantFilter(organizationId, { _id: customerId })).populate('areaId', 'name');
  if (!customer) return null;

  const orgId = tenantObjectId(organizationId);
  const rules = await getAnalyticsSettings(organizationId);
  const analyticsStatus = classifyCustomerStatus(
    customer.lastDeliveryDate,
    customer.status,
    rules
  );

  if (customer.analyticsStatus !== analyticsStatus) {
    customer.analyticsStatus = analyticsStatus;
    await customer.save();
  }

  const [deliveryStats, outstandingInvoices, monthlyTrend, coolerStats] = await Promise.all([
    Delivery.aggregate([
      { $match: { customerId: customer._id, organizationId: orgId, status: 'delivered' } },
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          totalQuantity: { $sum: '$filledGiven' },
          totalRevenue: { $sum: '$billableAmount' },
          lastDelivery: { $max: '$deliveryDate' },
        },
      },
    ]),
    Invoice.aggregate([
      {
        $match: {
          customerId: customer._id,
          organizationId: orgId,
          status: { $in: ['unpaid', 'partially_paid', 'pending'] },
        },
      },
      { $group: { _id: null, outstanding: { $sum: '$amountDue' } } },
    ]),
    Delivery.aggregate([
      {
        $match: {
          customerId: customer._id,
          organizationId: orgId,
          status: 'delivered',
          deliveryDate: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$deliveryDate' } },
          quantity: { $sum: '$filledGiven' },
          revenue: { $sum: '$billableAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    CoolerTransaction.aggregate([
      { $match: { customerId: customer._id, organizationId: orgId, type: { $in: ['lost', 'damaged'] } } },
      { $group: { _id: '$type', total: { $sum: '$quantity' } } },
    ]),
  ]);

  const stats = deliveryStats[0];
  const daysSinceLast = customer.lastDeliveryDate
    ? Math.floor((Date.now() - customer.lastDeliveryDate.getTime()) / 86400000)
    : null;

  let purchaseFrequency = 'Unknown';
  if (stats && stats.totalDeliveries > 0 && customer.createdAt) {
    const daysActive = Math.max(1, Math.floor((Date.now() - customer.createdAt.getTime()) / 86400000));
    const avgDays = daysActive / stats.totalDeliveries;
    if (avgDays <= 1.5) purchaseFrequency = 'Daily';
    else if (avgDays <= 3.5) purchaseFrequency = 'Every 2-3 days';
    else if (avgDays <= 8) purchaseFrequency = 'Weekly';
    else purchaseFrequency = 'Occasional';
  }

  const coolerMap = Object.fromEntries(coolerStats.map((c) => [c._id, c.total]));

  return {
    customerId: customer._id,
    name: customer.name,
    shopName: customer.shopName,
    area: (customer.areaId as { name?: string })?.name,
    totalDeliveries: stats?.totalDeliveries ?? 0,
    totalQuantity: stats?.totalQuantity ?? 0,
    totalRevenue: stats?.totalRevenue ?? 0,
    averagePurchaseFrequency: purchaseFrequency,
    lastDeliveryDate: customer.lastDeliveryDate,
    daysSinceLastDelivery: daysSinceLast,
    outstandingAmount: outstandingInvoices[0]?.outstanding ?? 0,
    ledgerBalance: customer.ledgerBalance ?? 0,
    currentCoolerBalance: customer.currentBalance,
    lostCoolers: customer.totalLost ?? coolerMap.lost ?? 0,
    damagedCoolers: customer.totalDamaged ?? coolerMap.damaged ?? 0,
    monthlyTrend,
    analyticsStatus,
    location: {
      latitude: customer.latitude,
      longitude: customer.longitude,
      googleMapsUrl: customer.googleMapsUrl,
      locationNotes: customer.locationNotes,
      address: customer.address,
    },
  };
}

export async function refreshAllCustomerAnalytics(organizationId: string) {
  const rules = await getAnalyticsSettings(organizationId);
  const customers = await Customer.find(tenantFilter(organizationId, { status: 'active' }));
  let updated = 0;

  for (const c of customers) {
    const status = classifyCustomerStatus(c.lastDeliveryDate, c.status, rules);
    if (c.analyticsStatus !== status) {
      c.analyticsStatus = status;
      await c.save();
      updated++;
    }
  }

  return { updated, total: customers.length };
}

export async function getInactiveCustomers(organizationId: string, limit = 20) {
  const rules = await getAnalyticsSettings(organizationId);
  const threshold = new Date(Date.now() - rules.inactiveDaysThreshold * 86400000);
  const query: Record<string, unknown> = {
    ...tenantFilter(organizationId),
    status: 'active',
    $or: [
      { analyticsStatus: 'inactive' },
      { analyticsStatus: 'at_risk' },
      { lastDeliveryDate: { $lt: threshold } },
      { lastDeliveryDate: { $exists: false } },
    ],
  };

  return Customer.find(query)
    .populate('areaId', 'name')
    .sort({ lastDeliveryDate: 1 })
    .limit(limit);
}
