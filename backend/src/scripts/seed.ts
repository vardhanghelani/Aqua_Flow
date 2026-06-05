import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, Area, Driver, Customer, PriceHistory, InventorySettings } from '../models';

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
  ]);

  const hashed = await bcrypt.hash('admin123', 10);
  const owner = await User.create({
    name: 'Business Owner',
    email: 'owner@aquaflow.com',
    password: hashed,
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

  await Customer.insertMany([
    {
      name: 'Ramesh Kumar',
      shopName: 'Ramesh General Store',
      mobile: '9123456780',
      address: '12 Market Road, Area A',
      areaId: areaA._id,
      createdBy: owner._id,
    },
    {
      name: 'Suresh Patel',
      shopName: 'Patel Tea Stall',
      mobile: '9123456781',
      address: '45 Station Road, Area A',
      areaId: areaA._id,
      customPrice: 22,
      createdBy: owner._id,
    },
    {
      name: 'Anil Sharma',
      shopName: 'Sharma Electronics',
      mobile: '9123456782',
      address: '78 Main Street, Area B',
      areaId: areaB._id,
      createdBy: owner._id,
    },
    {
      name: 'Vijay Singh',
      shopName: 'Singh Restaurant',
      mobile: '9123456783',
      address: '3 Food Court, Area C',
      areaId: areaC._id,
      createdBy: owner._id,
    },
  ]);

  await PriceHistory.create({
    price: 20,
    effectiveFrom: new Date('2025-01-01'),
    changedBy: owner._id,
  });

  await InventorySettings.create({
    totalCoolersOwned: 1000,
    warehouseStock: 800,
    inCirculation: 50,
    updatedBy: owner._id,
  });

  console.log('\nSeed completed!');
  console.log('Owner: owner@aquaflow.com / admin123');
  console.log('Driver 1: driver1@aquaflow.com / driver123');
  console.log('Driver 2: driver2@aquaflow.com / driver123');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
