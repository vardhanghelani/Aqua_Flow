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

export async function getOrCreateSettings() {
  let settings = await InventorySettings.findOne();
  if (!settings) {
    settings = await InventorySettings.create({
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

export async function getInventorySnapshot(): Promise<InventorySnapshotV2> {
  const settings = await getOrCreateSettings();
  const agg = await Customer.aggregate([
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
  const settings = await getOrCreateSettings();
  if (data.totalCoolersOwned !== undefined) settings.totalCoolersOwned = data.totalCoolersOwned;
  if (data.warehouseStock !== undefined) settings.warehouseStock = data.warehouseStock;
  if (data.inTransit !== undefined) settings.inTransit = data.inTransit;
  if (data.inCirculation !== undefined) settings.inCirculation = data.inCirculation;
  if (data.damagedStock !== undefined) settings.damagedStock = data.damagedStock;
  if (data.lostStock !== undefined) settings.lostStock = data.lostStock;
  settings.updatedBy = new Types.ObjectId(userId);
  await settings.save();
  return getInventorySnapshot();
}

export async function adjustInventory(
  filledOut: number,
  emptyIn: number,
  notes: string,
  userId: string,
  type: 'delivery' | 'adjustment' = 'adjustment',
  deliveryId?: string
) {
  const settings = await getOrCreateSettings();
  settings.warehouseStock = settings.warehouseStock - filledOut + emptyIn;
  if (settings.warehouseStock < 0) settings.warehouseStock = 0;
  settings.updatedBy = new Types.ObjectId(userId);
  await settings.save();

  await InventoryTransaction.create({
    type,
    deliveryId: deliveryId ? new Types.ObjectId(deliveryId) : undefined,
    filledOut,
    emptyIn,
    warehouseAfter: settings.warehouseStock,
    notes,
    createdBy: new Types.ObjectId(userId),
  });

  return getInventorySnapshot();
}

export async function applyDeliveryInventoryDelta(
  prevFilled: number,
  prevReturned: number,
  newFilled: number,
  newReturned: number,
  userId: string,
  deliveryId: string
) {
  const filledDelta = newFilled - prevFilled;
  const returnedDelta = newReturned - prevReturned;
  if (filledDelta === 0 && returnedDelta === 0) return getInventorySnapshot();

  return adjustInventory(
    filledDelta,
    returnedDelta,
    'Delivery inventory update',
    userId,
    'delivery',
    deliveryId
  );
}

export async function reconcileInventory() {
  const snapshot = await getInventorySnapshot();
  const settings = await getOrCreateSettings();

  const customerAgg = await Customer.aggregate([
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

export async function listInventoryTransactions(page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    InventoryTransaction.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    InventoryTransaction.countDocuments(),
  ]);
  return { items, total, page, limit };
}
