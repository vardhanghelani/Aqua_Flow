import 'dotenv/config';
import mongoose from 'mongoose';
import { Organization, Customer, Area, Driver, Payment } from '../models';

async function migrate() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aqua_flow';
  await mongoose.connect(uri);
  console.log('Connected — running Phase 3 migration');

  let org = await Organization.findOne({ isDefault: true });
  if (!org) {
    org = await Organization.create({
      name: 'Aqua Flow Default',
      slug: 'aqua-flow-default',
      isDefault: true,
      isActive: true,
    });
    console.log('Created default organization');
  }

  const orgId = org._id;

  const customerResult = await Customer.updateMany(
    { creditLimit: { $exists: false } },
    {
      $set: {
        creditLimit: 0,
        deletedAt: null,
        organizationId: orgId,
      },
    }
  );
  console.log(`Updated ${customerResult.modifiedCount} customers`);

  const areaResult = await Area.updateMany(
    { deletedAt: { $exists: false } },
    { $set: { deletedAt: null, organizationId: orgId } }
  );
  console.log(`Updated ${areaResult.modifiedCount} areas`);

  const driverResult = await Driver.updateMany(
    { deletedAt: { $exists: false } },
    { $set: { deletedAt: null, organizationId: orgId } }
  );
  console.log(`Updated ${driverResult.modifiedCount} drivers`);

  const paymentResult = await Payment.updateMany(
    { driverId: { $exists: false } },
    { $set: {} }
  );
  console.log(`Verified ${paymentResult.matchedCount} payments`);

  console.log('Phase 3 migration complete');
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
