import { LedgerEntry, Customer, Delivery, Invoice } from '../models';
import { LedgerEntryType } from '../models/LedgerEntry';
import mongoose, { Types } from 'mongoose';
import { parseDateOnly, endOfDay } from '../utils/date';
import { assertCustomerInOrg, tenantFilter } from '../utils/tenant';

interface CreateLedgerInput {
  customerId: string;
  date: Date;
  particular: string;
  entryType: LedgerEntryType;
  debit?: number;
  credit?: number;
  referenceType?: string;
  referenceId?: string;
  userId?: string;
}

export async function createLedgerEntry(input: CreateLedgerInput, session?: mongoose.ClientSession | null) {
  const customer = await Customer.findById(input.customerId).session(session ?? null);
  if (!customer) throw new Error('Customer not found for ledger entry');

  const debit = input.debit ?? 0;
  const credit = input.credit ?? 0;
  const newBalance = (customer.ledgerBalance ?? 0) + debit - credit;

  const [entry] = await LedgerEntry.create(
    [
      {
        organizationId: customer.organizationId,
        customerId: customer._id,
        date: input.date,
        particular: input.particular,
        entryType: input.entryType,
        debit,
        credit,
        balance: newBalance,
        referenceType: input.referenceType,
        referenceId: input.referenceId ? new Types.ObjectId(input.referenceId) : undefined,
        createdBy: input.userId ? new Types.ObjectId(input.userId) : undefined,
      },
    ],
    session ? { session } : undefined
  );

  customer.ledgerBalance = newBalance;
  await customer.save(session ? { session } : undefined);

  return entry;
}

export async function recordReversalEntry(
  input: {
    customerId: string;
    amount: number;
    originalEntryType: string;
    referenceType: string;
    referenceId: string;
    particular: string;
    userId: string;
    /** true = reverse a debit (post credit); false = reverse a credit (post debit) */
    reverseDebit: boolean;
  },
  session?: mongoose.ClientSession | null
) {
  if (input.amount <= 0) return null;
  return createLedgerEntry(
    {
      customerId: input.customerId,
      date: new Date(),
      particular: input.particular,
      entryType: 'reversal',
      debit: input.reverseDebit ? 0 : input.amount,
      credit: input.reverseDebit ? input.amount : 0,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      userId: input.userId,
    },
    session
  );
}

export async function getCustomerLedger(
  customerId: string,
  organizationId: string,
  filters?: { from?: string; to?: string; page?: number; limit?: number }
) {
  await assertCustomerInOrg(customerId, organizationId);
  const query: Record<string, unknown> = tenantFilter(organizationId, {
    customerId: new Types.ObjectId(customerId),
  });

  if (filters?.from || filters?.to) {
    query.date = {};
    if (filters.from) (query.date as Record<string, Date>).$gte = parseDateOnly(filters.from);
    if (filters.to) (query.date as Record<string, Date>).$lte = endOfDay(parseDateOnly(filters.to));
  }

  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 100;
  const skip = (page - 1) * limit;

  const [items, total, customer] = await Promise.all([
    LedgerEntry.find(query).sort({ date: 1, createdAt: 1 }).skip(skip).limit(limit),
    LedgerEntry.countDocuments(query),
    Customer.findOne(tenantFilter(organizationId, { _id: customerId })).select('name shopName mobile ledgerBalance'),
  ]);

  return { customer, items, total, page, limit };
}

/** @deprecated Deliveries no longer post to ledger — invoice-only model */
export async function recordDeliveryCharge() {
  return null;
}

export async function recordInvoiceEntry(
  customerId: string,
  amount: number,
  invoiceId: string,
  invoiceNumber: string,
  date: Date,
  userId: string,
  session?: mongoose.ClientSession | null
) {
  return createLedgerEntry(
    {
      customerId,
      date,
      particular: `Invoice ${invoiceNumber} generated`,
      entryType: 'invoice',
      debit: amount,
      referenceType: 'Invoice',
      referenceId: invoiceId,
      userId,
    },
    session
  );
}

export async function recordInvoiceVoidEntry(
  customerId: string,
  amount: number,
  invoiceId: string,
  invoiceNumber: string,
  userId: string,
  session?: mongoose.ClientSession | null
) {
  return createLedgerEntry(
    {
      customerId,
      date: new Date(),
      particular: `Invoice ${invoiceNumber} voided`,
      entryType: 'invoice_void',
      credit: amount,
      referenceType: 'Invoice',
      referenceId: invoiceId,
      userId,
    },
    session
  );
}

export async function recordPaymentEntry(
  customerId: string,
  amount: number,
  paymentId: string,
  reference: string,
  date: Date,
  userId: string,
  session?: mongoose.ClientSession | null
) {
  return createLedgerEntry(
    {
      customerId,
      date,
      particular: `Payment received — ${reference}`,
      entryType: 'payment',
      credit: amount,
      referenceType: 'Payment',
      referenceId: paymentId,
      userId,
    },
    session
  );
}

export async function recordPaymentReversal(
  customerId: string,
  amount: number,
  paymentId: string,
  userId: string,
  session?: mongoose.ClientSession | null
) {
  return recordReversalEntry(
    {
      customerId,
      amount,
      originalEntryType: 'payment',
      referenceType: 'Payment',
      referenceId: paymentId,
      particular: `Payment reversal`,
      userId,
      reverseDebit: false,
    },
    session
  );
}

/** Sum of delivered-but-not-yet-invoiced billable amounts for credit checks */
export async function getUninvoicedBillableTotal(customerId: string): Promise<number> {
  const invoicedDeliveryIds = await Invoice.aggregate([
    { $match: { customerId: new Types.ObjectId(customerId), status: { $ne: 'void' } } },
    { $unwind: '$items' },
    { $group: { _id: null, ids: { $addToSet: '$items.deliveryId' } } },
  ]);

  const excludeIds = (invoicedDeliveryIds[0]?.ids ?? []).map((id: Types.ObjectId) => id);

  const match: Record<string, unknown> = {
    customerId: new Types.ObjectId(customerId),
    status: 'delivered',
    billableAmount: { $gt: 0 },
  };
  if (excludeIds.length > 0) {
    match._id = { $nin: excludeIds };
  }

  const agg = await Delivery.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$billableAmount' } } },
  ]);

  return agg[0]?.total ?? 0;
}

/** Rebuild customer.ledgerBalance from entry chain (excludes legacy delivery_charge after migration reversals) */
export async function recalculateCustomerBalance(customerId: string): Promise<number> {
  const entries = await LedgerEntry.find({ customerId: new Types.ObjectId(customerId) }).sort({
    date: 1,
    createdAt: 1,
  });

  let balance = 0;
  for (const entry of entries) {
    balance += entry.debit - entry.credit;
    if (entry.balance !== balance) {
      entry.balance = balance;
      await entry.save();
    }
  }

  await Customer.findByIdAndUpdate(customerId, { ledgerBalance: balance });
  return balance;
}

export async function validateLedgerConsistency(customerId: string): Promise<{
  consistent: boolean;
  storedBalance: number;
  computedBalance: number;
}> {
  const customer = await Customer.findById(customerId).select('ledgerBalance');
  const entries = await LedgerEntry.find({ customerId: new Types.ObjectId(customerId) }).sort({
    date: 1,
    createdAt: 1,
  });

  const computed = entries.reduce((b, e) => b + e.debit - e.credit, 0);
  const stored = customer?.ledgerBalance ?? 0;

  return {
    consistent: Math.abs(computed - stored) < 0.01,
    storedBalance: stored,
    computedBalance: computed,
  };
}
