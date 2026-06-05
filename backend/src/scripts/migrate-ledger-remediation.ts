import 'dotenv/config';
import mongoose from 'mongoose';
import { LedgerEntry, Customer, Payment, Invoice } from '../models';
import { recalculateCustomerBalance } from '../services/ledger.service';
import { syncInvoiceStatusFromPayments } from '../services/invoice.service';

async function migrate() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aqua_flow';
  await mongoose.connect(uri);
  console.log('Connected — running ledger remediation migration');

  const deliveryCharges = await LedgerEntry.find({ entryType: 'delivery_charge' });
  console.log(`Found ${deliveryCharges.length} legacy delivery_charge entries`);

  let reversalsCreated = 0;
  for (const entry of deliveryCharges) {
    const existingReversal = await LedgerEntry.findOne({
      entryType: 'reversal',
      referenceId: entry._id,
      referenceType: 'LedgerEntry',
    });
    if (existingReversal) continue;

    const customer = await Customer.findById(entry.customerId);
    if (!customer) continue;

    const newBalance = (customer.ledgerBalance ?? 0) - entry.debit;
    await LedgerEntry.create({
      customerId: entry.customerId,
      date: new Date(),
      particular: `Migration reversal: delivery charge (${entry.particular})`,
      entryType: 'reversal',
      debit: 0,
      credit: entry.debit,
      balance: newBalance,
      referenceType: 'LedgerEntry',
      referenceId: entry._id,
    });
    customer.ledgerBalance = newBalance;
    await customer.save();
    reversalsCreated++;
  }
  console.log(`Created ${reversalsCreated} reversal entries`);

  const customers = await Customer.find({}).select('_id');
  for (const c of customers) {
    await recalculateCustomerBalance(c._id.toString());
  }
  console.log(`Recalculated balances for ${customers.length} customers`);

  const invoices = await Invoice.find({ status: { $ne: 'void' } });
  for (const inv of invoices) {
    await syncInvoiceStatusFromPayments(inv._id.toString());
  }
  console.log(`Synced status for ${invoices.length} invoices from payments`);

  console.log('Ledger remediation migration complete');
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
