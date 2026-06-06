import { Customer, InventorySettings, InventoryTransaction } from '../models';
import { Types } from 'mongoose';

export interface InventorySnapshotV2 {
  totalCoolersOwned: number;
  warehouseStock: number;
  inTransit: number;
  inCirculation: number;
  customerHoldings: number;
  damagedStock: number;
  lostStock: number;
  computedTotal: number;
  missingCoolers: number;
  isBalanced: boolean;
}

export async function getOrCreateSettings(organizationId: string) {
  const orgId = new Types.ObjectId(organizationId);
  let settings = await InventorySettings.findOne({ organizationId: orgId });
  if (!settings) {
    settings = await InventorySettings.create({
      organizationId: orgId,
      totalCoolersOwned: 0,
      warehouseStock: 0,
      inTransit: 0,
      inCirculation: 0,
      damagedStock: 0,
      lostStock: 0,
    });
  }
  return settings;
}

export async function getInventorySnapshot(organizationId: string): Promise<InventorySnapshotV2> {
  const settings = await getOrCreateSettings(organizationId);
  const orgId = new Types.ObjectId(organizationId);
  const agg = await Customer.aggregate([
    { $match: { organizationId: orgId, deletedAt: null } },
    { $group: { _id: null, total: { $sum: '$currentBalance' } } },
  ]);
  const customerHoldings = agg[0]?.total ?? 0;

  const inTransit = settings.inTransit ?? 0;
  const damagedStock = settings.damagedStock ?? 0;
  const lostStock = settings.lostStock ?? 0;

  const computedTotal =
    settings.warehouseStock +
    inTransit +
    customerHoldings +
    (settings.inCirculation ?? 0) +
    damagedStock +
    lostStock;

  const missingCoolers = settings.totalCoolersOwned - computedTotal;

  return {
    totalCoolersOwned: settings.totalCoolersOwned,
    warehouseStock: settings.warehouseStock,
    inTransit,
    inCirculation: settings.inCirculation ?? 0,
    customerHoldings,
    damagedStock,
    lostStock,
    computedTotal,
    missingCoolers,
    isBalanced: missingCoolers === 0,
  };
}

export async function updateSettings(
  organizationId: string,
  data: {
    totalCoolersOwned?: number;
    warehouseStock?: number;
    inTransit?: number;
    inCirculation?: number;
    damagedStock?: number;
    lostStock?: number;
  },
  userId: string
) {
  const settings = await getOrCreateSettings(organizationId);
  if (data.totalCoolersOwned !== undefined) settings.totalCoolersOwned = data.totalCoolersOwned;
  if (data.warehouseStock !== undefined) settings.warehouseStock = data.warehouseStock;
  if (data.inTransit !== undefined) settings.inTransit = data.inTransit;
  if (data.inCirculation !== undefined) settings.inCirculation = data.inCirculation;
  if (data.damagedStock !== undefined) settings.damagedStock = data.damagedStock;
  if (data.lostStock !== undefined) settings.lostStock = data.lostStock;
  settings.updatedBy = new Types.ObjectId(userId);
  await settings.save();
  return getInventorySnapshot(organizationId);
}

export async function adjustInventory(
  organizationId: string,
  filledOut: number,
  emptyIn: number,
  notes: string,
  userId: string,
  type: 'delivery' | 'adjustment' = 'adjustment',
  deliveryId?: string
) {
  const settings = await getOrCreateSettings(organizationId);
  settings.warehouseStock = settings.warehouseStock - filledOut + emptyIn;
  if (settings.warehouseStock < 0) settings.warehouseStock = 0;
  settings.updatedBy = new Types.ObjectId(userId);
  await settings.save();

  await InventoryTransaction.create({
    organizationId: new Types.ObjectId(organizationId),
    type,
    deliveryId: deliveryId ? new Types.ObjectId(deliveryId) : undefined,
    filledOut,
    emptyIn,
    warehouseAfter: settings.warehouseStock,
    notes,
    createdBy: new Types.ObjectId(userId),
  });

  return getInventorySnapshot(organizationId);
}

export async function applyDeliveryInventoryDelta(
  organizationId: string,
  prevFilled: number,
  prevReturned: number,
  newFilled: number,
  newReturned: number,
  userId: string,
  deliveryId: string
) {
  const filledDelta = newFilled - prevFilled;
  const returnedDelta = newReturned - prevReturned;
  if (filledDelta === 0 && returnedDelta === 0) return getInventorySnapshot(organizationId);

  return adjustInventory(
    organizationId,
    filledDelta,
    returnedDelta,
    'Delivery inventory update',
    userId,
    'delivery',
    deliveryId
  );
}

export async function reconcileInventory(organizationId: string) {
  const snapshot = await getInventorySnapshot(organizationId);
  const settings = await getOrCreateSettings(organizationId);
  const orgId = new Types.ObjectId(organizationId);

  const customerAgg = await Customer.aggregate([
    { $match: { organizationId: orgId, deletedAt: null } },
    {
      $group: {
        _id: null,
        holdings: { $sum: '$currentBalance' },
        totalLost: { $sum: '$totalLost' },
        totalDamaged: { $sum: '$totalDamaged' },
      },
    },
  ]);

  const issues: string[] = [];
  if (!snapshot.isBalanced) {
    issues.push(`${snapshot.missingCoolers} coolers unaccounted for`);
  }
  if (settings.damagedStock !== (customerAgg[0]?.totalDamaged ?? 0)) {
    issues.push('Damaged stock mismatch between settings and customer totals');
  }
  if (settings.lostStock !== (customerAgg[0]?.totalLost ?? 0)) {
    issues.push('Lost stock mismatch between settings and customer totals');
  }

  return {
    snapshot,
    formula: 'warehouse + inTransit + withCustomers + inCirculation + damaged + lost = totalOwned',
    issues,
    healthy: issues.length === 0 && snapshot.isBalanced,
  };
}

export async function listInventoryTransactions(organizationId: string, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const orgId = new Types.ObjectId(organizationId);
  const [items, total] = await Promise.all([
    InventoryTransaction.find({ organizationId: orgId })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    InventoryTransaction.countDocuments({ organizationId: orgId }),
  ]);
  return { items, total, page, limit };
}
