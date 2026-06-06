import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import {
  User,
  Area,
  Driver,
  Customer,
  PriceHistory,
  InventorySettings,
  DriverAreaAssignment,
  Delivery,
  Invoice,
  Payment,
  LedgerEntry,
  DriverDailySettlement,
  DriverCollection,
  Expense,
  CoolerTransaction,
  AuditLog,
  AnalyticsSettings,
} from '../models';
import { startOfDay } from '../utils/date';

const DEFAULT_PRICE = 20;

export function logSeedSummary() {
  console.log('\n=== Aqua Flow — fresh database loaded ===\n');
  console.log('LOGIN (collection: users)\n');
  console.log('  Owner:   owner    / admin123');
  console.log('  Driver:  driver1  / driver123   → Area A (4 shops)');
  console.log('  Driver:  driver2  / driver123   → Area B (3 shops)\n');
  console.log('Sample data includes areas, customers, assignments, deliveries,');
  console.log('inventory, pricing, 1 pending invoice, 1 driver collection, 1 expense.\n');
}

/** Drops every collection in the connected database. */
export async function wipeDatabase(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database not connected');
  const name = db.databaseName;
  await db.dropDatabase();
  console.log(`Wiped database: ${name} (all collections removed)`);
}

async function ensureUserIndexes() {
  try {
    await User.collection.dropIndex('email_1');
  } catch {
    // legacy index already removed
  }
  await User.syncIndexes();
}

/** @param wipe — true = drop entire DB first. false = bootstrap only if no users. */
export async function runSeed(options: { wipe?: boolean } = {}): Promise<boolean> {
  const { wipe = true } = options;

  if (!wipe) {
    const existing = await User.countDocuments();
    if (existing > 0) {
      console.log('Bootstrap seed skipped: users already exist');
      return false;
    }
    console.log('Empty database detected — loading sample data...');
  } else {
    await wipeDatabase();
  }

  await ensureUserIndexes();

  const owner = await User.create({
    name: 'Business Owner',
    loginId: 'owner',
    password: await bcrypt.hash('admin123', 10),
    role: 'owner',
  });

  const areaA = await Area.create({ name: 'Area A', description: 'North zone', createdBy: owner._id });
  const areaB = await Area.create({ name: 'Area B', description: 'South zone', createdBy: owner._id });
  const areaC = await Area.create({ name: 'Area C', description: 'East zone', createdBy: owner._id });

  const driverUser1 = await User.create({
    name: 'Rajesh Kumar',
    loginId: 'driver1',
    password: await bcrypt.hash('driver123', 10),
    role: 'driver',
    createdBy: owner._id,
  });

  const driver1 = await Driver.create({
    name: 'Rajesh Kumar',
    mobile: '9876543210',
    userId: driverUser1._id,
    createdBy: owner._id,
  });
  driverUser1.driverProfile = driver1._id;
  await driverUser1.save();

  const driverUser2 = await User.create({
    name: 'Sunil Verma',
    loginId: 'driver2',
    password: await bcrypt.hash('driver123', 10),
    role: 'driver',
    createdBy: owner._id,
  });

  const driver2 = await Driver.create({
    name: 'Sunil Verma',
    mobile: '9876543211',
    userId: driverUser2._id,
    createdBy: owner._id,
  });
  driverUser2.driverProfile = driver2._id;
  await driverUser2.save();

  const assignmentStart = startOfDay(new Date('2026-01-12'));

  await DriverAreaAssignment.insertMany([
    {
      driverId: driver1._id,
      areaId: areaA._id,
      assignedBy: owner._id,
      startDate: assignmentStart,
      isActive: true,
      createdBy: owner._id,
    },
    {
      driverId: driver2._id,
      areaId: areaB._id,
      assignedBy: owner._id,
      startDate: assignmentStart,
      isActive: true,
      createdBy: owner._id,
    },
  ]);

  const customers = await Customer.insertMany([
    {
      name: 'Ramesh Kumar',
      shopName: 'Ramesh General Store',
      mobile: '9123456780',
      address: '12 Market Road, Area A',
      areaId: areaA._id,
      totalFilledGiven: 3,
      totalEmptyReturned: 0,
      currentBalance: 3,
      lastDeliveryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdBy: owner._id,
    },
    {
      name: 'Suresh Patel',
      shopName: 'Patel Pan Shop',
      mobile: '9123456781',
      address: '45 Station Road, Area A',
      areaId: areaA._id,
      customPrice: 22,
      totalFilledGiven: 4,
      totalEmptyReturned: 0,
      currentBalance: 4,
      lastDeliveryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdBy: owner._id,
    },
    {
      name: 'Meena Devi',
      shopName: 'Meena Kirana',
      mobile: '9123456784',
      address: '22 Temple Street, Area A',
      areaId: areaA._id,
      totalFilledGiven: 2,
      totalEmptyReturned: 0,
      currentBalance: 2,
      createdBy: owner._id,
    },
    {
      name: 'Kiran Shah',
      shopName: 'Shah Tea Corner',
      mobile: '9123456786',
      address: '5 Bus Stand Road, Area A',
      areaId: areaA._id,
      totalFilledGiven: 1,
      totalEmptyReturned: 0,
      currentBalance: 1,
      createdBy: owner._id,
    },
    {
      name: 'Anil Sharma',
      shopName: 'Sharma Electronics',
      mobile: '9123456782',
      address: '78 Main Street, Area B',
      areaId: areaB._id,
      totalFilledGiven: 5,
      totalEmptyReturned: 0,
      currentBalance: 5,
      lastDeliveryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      createdBy: owner._id,
    },
    {
      name: 'Priya Gupta',
      shopName: 'Gupta Medical Store',
      mobile: '9123456785',
      address: '9 Hospital Lane, Area B',
      areaId: areaB._id,
      totalFilledGiven: 1,
      totalEmptyReturned: 0,
      currentBalance: 1,
      createdBy: owner._id,
    },
    {
      name: 'Deepak Joshi',
      shopName: 'Joshi Sweets',
      mobile: '9123456787',
      address: '14 College Road, Area B',
      areaId: areaB._id,
      totalFilledGiven: 3,
      totalEmptyReturned: 0,
      currentBalance: 3,
      createdBy: owner._id,
    },
    {
      name: 'Vijay Singh',
      shopName: 'Singh Restaurant',
      mobile: '9123456783',
      address: '3 Food Court, Area C',
      areaId: areaC._id,
      totalFilledGiven: 6,
      totalEmptyReturned: 0,
      currentBalance: 6,
      createdBy: owner._id,
    },
    {
      name: 'Amit Yadav',
      shopName: 'Yadav Hardware',
      mobile: '9123456788',
      address: '88 Industrial Area, Area C',
      areaId: areaC._id,
      totalFilledGiven: 2,
      totalEmptyReturned: 0,
      currentBalance: 2,
      createdBy: owner._id,
    },
  ]);

  await PriceHistory.create({
    price: DEFAULT_PRICE,
    effectiveFrom: new Date('2025-01-01'),
    changedBy: owner._id,
  });

  await InventorySettings.create({
    totalCoolersOwned: 1000,
    warehouseStock: 800,
    inCirculation: 50,
    updatedBy: owner._id,
  });

  await AnalyticsSettings.create({});

  const today = startOfDay();
  const yesterday = startOfDay(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const twoDaysAgo = startOfDay(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000));

  const [ramesh, patel, meena, sharma, gupta] = customers;

  await Delivery.insertMany([
    {
      customerId: patel._id,
      driverId: driver1._id,
      areaId: areaA._id,
      deliveryDate: twoDaysAgo,
      status: 'delivered',
      filledGiven: 2,
      emptyReturned: 2,
      unitPrice: 22,
      billableAmount: 44,
      createdBy: driverUser1._id,
    },
    {
      customerId: ramesh._id,
      driverId: driver1._id,
      areaId: areaA._id,
      deliveryDate: yesterday,
      status: 'delivered',
      filledGiven: 2,
      emptyReturned: 2,
      unitPrice: DEFAULT_PRICE,
      billableAmount: 40,
      createdBy: driverUser1._id,
    },
    {
      customerId: ramesh._id,
      driverId: driver1._id,
      areaId: areaA._id,
      deliveryDate: today,
      status: 'delivered',
      filledGiven: 2,
      emptyReturned: 1,
      unitPrice: DEFAULT_PRICE,
      billableAmount: 40,
      remarks: 'One empty short',
      createdBy: driverUser1._id,
    },
    {
      customerId: sharma._id,
      driverId: driver2._id,
      areaId: areaB._id,
      deliveryDate: today,
      status: 'delivered',
      filledGiven: 3,
      emptyReturned: 3,
      unitPrice: DEFAULT_PRICE,
      billableAmount: 60,
      createdBy: driverUser2._id,
    },
    {
      customerId: gupta._id,
      driverId: driver2._id,
      areaId: areaB._id,
      deliveryDate: yesterday,
      status: 'not_delivered',
      filledGiven: 0,
      emptyReturned: 0,
      unitPrice: 0,
      billableAmount: 0,
      remarks: 'Shop closed',
      createdBy: driverUser2._id,
    },
  ]);

  await DriverCollection.create({
    driverId: driver1._id,
    collectionDate: today,
    amount: 500,
    paymentMethod: 'cash',
    notes: 'Sample cash collected from Area A',
    reconciled: false,
    createdBy: driverUser1._id,
  });

  await Expense.create({
    category: 'diesel',
    amount: 1200,
    expenseDate: today,
    description: 'Diesel for delivery van',
    createdBy: owner._id,
  });

  try {
    const { generateInvoice } = await import('./invoice.service');
    const monthStart = startOfDay(new Date(today.getFullYear(), today.getMonth(), 1));
    await generateInvoice({
      customerId: patel._id.toString(),
      periodStart: monthStart.toISOString().slice(0, 10),
      periodEnd: today.toISOString().slice(0, 10),
      invoiceType: 'custom',
      userId: owner._id.toString(),
    });
    console.log('Sample invoice created for Patel Pan Shop');
  } catch (err) {
    console.warn('Invoice seed skipped:', err instanceof Error ? err.message : err);
  }

  logSeedSummary();
  return true;
}
