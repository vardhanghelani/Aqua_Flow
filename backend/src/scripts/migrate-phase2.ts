import 'dotenv/config';
import mongoose from 'mongoose';
import { Invoice, Customer, InventorySettings } from '../models';

async function migrate() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aqua_flow';
  await mongoose.connect(uri);
  console.log('Connected — running Phase 2 migration');

  const invoices = await Invoice.find({});
  let invoiceUpdates = 0;
  for (const inv of invoices) {
    let changed = false;
    if (inv.status === 'pending') {
      inv.status = 'unpaid';
      changed = true;
    }
    if (inv.amountDue === undefined || inv.amountDue === null) {
      inv.amountDue = inv.totalAmount - (inv.amountPaid ?? 0);
      changed = true;
    }
    if (inv.amountPaid === undefined || inv.amountPaid === null) {
      inv.amountPaid = inv.status === 'paid' ? inv.totalAmount : 0;
      changed = true;
    }
    if (changed) {
      await inv.save();
      invoiceUpdates++;
    }
  }
  console.log(`Updated ${invoiceUpdates} invoices`);

  const customerResult = await Customer.updateMany(
    { totalLost: { $exists: false } },
    {
      $set: {
        totalLost: 0,
        totalDamaged: 0,
        analyticsStatus: 'active',
        ledgerBalance: 0,
      },
    }
  );
  console.log(`Updated ${customerResult.modifiedCount} customers with Phase 2 fields`);

  const invSettings = await InventorySettings.findOne();
  if (invSettings) {
    if (invSettings.inTransit === undefined) invSettings.inTransit = 0;
    if (invSettings.damagedStock === undefined) invSettings.damagedStock = 0;
    if (invSettings.lostStock === undefined) invSettings.lostStock = 0;
    await invSettings.save();
    console.log('Updated inventory settings');
  }

  console.log('Phase 2 migration complete');
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
