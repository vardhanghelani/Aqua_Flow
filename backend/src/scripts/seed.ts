import 'dotenv/config';
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
} from '../models';
import { startOfDay } from '../utils/date';

const DEFAULT_PRICE = 20;

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aqua_flow';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  await Promise.all([
    User.deleteMany({}),
    Area.deleteMany({}),
    Driver.deleteMany({}),
    Customer.deleteMany({}),
    PriceHistory.deleteMany({}),
    InventorySettings.deleteMany({}),
    DriverAreaAssignment.deleteMany({}),
    Delivery.deleteMany({}),
    Invoice.deleteMany({}),
    Payment.deleteMany({}),
    LedgerEntry.deleteMany({}),
    DriverDailySettlement.deleteMany({}),
    DriverCollection.deleteMany({}),
    Expense.deleteMany({}),
    CoolerTransaction.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  const owner = await User.create({
    name: 'Business Owner',
    email: 'owner@aquaflow.com',
    password: await bcrypt.hash('admin123', 10),
    role: 'owner',
  });

  const areaA = await Area.create({ name: 'Area A', description: 'North zone', createdBy: owner._id });
  const areaB = await Area.create({ name: 'Area B', description: 'South zone', createdBy: owner._id });
  const areaC = await Area.create({ name: 'Area C', description: 'East zone', createdBy: owner._id });

  const driverUser1 = await User.create({
    name: 'Driver 1',
    email: 'driver1@aquaflow.com',
    password: await bcrypt.hash('driver123', 10),
    role: 'driver',
    createdBy: owner._id,
  });

  const driver1 = await Driver.create({
    name: 'Driver 1',
    mobile: '9876543210',
    userId: driverUser1._id,
    createdBy: owner._id,
  });
  driverUser1.driverProfile = driver1._id;
  await driverUser1.save();

  const driverUser2 = await User.create({
    name: 'Driver 2',
    email: 'driver2@aquaflow.com',
    password: await bcrypt.hash('driver123', 10),
    role: 'driver',
    createdBy: owner._id,
  });

  const driver2 = await Driver.create({
    name: 'Driver 2',
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
      currentBalance: 2,
      createdBy: owner._id,
    },
    {
      name: 'Anil Sharma',
      shopName: 'Sharma Electronics',
      mobile: '9123456782',
      address: '78 Main Street, Area B',
      areaId: areaB._id,
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
      currentBalance: 1,
      createdBy: owner._id,
    },
    {
      name: 'Vijay Singh',
      shopName: 'Singh Restaurant',
      mobile: '9123456783',
      address: '3 Food Court, Area C',
      areaId: areaC._id,
      currentBalance: 6,
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

  const today = startOfDay();
  const yesterday = startOfDay(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const [patel, ramesh, sharma] = [customers[1], customers[0], customers[3]];

  await Delivery.insertMany([
    {
      customerId: patel._id,
      driverId: driver1._id,
      areaId: areaA._id,
      deliveryDate: yesterday,
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
  ]);

  console.log('\n=== Aqua Flow sample data loaded ===\n');
  console.log('LOGIN (stored in MongoDB `users` collection, passwords bcrypt-hashed):\n');
  console.log('  Owner:   owner@aquaflow.com   / admin123');
  console.log('  Driver:  driver1@aquaflow.com / driver123  (Area A — 3 customers)');
  console.log('  Driver:  driver2@aquaflow.com / driver123  (Area B — 2 customers)\n');
  console.log('MongoDB collections populated:');
  console.log('  users                  — login accounts (owner + 2 drivers)');
  console.log('  drivers                — driver profiles linked to users');
  console.log('  areas                  — Area A, B, C');
  console.log('  customers              — 6 sample shops');
  console.log('  driverareaassignments  — Driver 1→Area A, Driver 2→Area B');
  console.log('  pricehistories         — default price ₹20');
  console.log('  inventorysettings      — 1000 coolers, 800 in warehouse');
  console.log('  deliveries             — 3 sample delivery records\n');
  console.log('Re-run anytime: npm run seed (WARNING: wipes demo data)\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
