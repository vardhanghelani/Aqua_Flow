import { Payment, Invoice } from '../models';
import { PaymentMethod } from '../models/Payment';
import { Types } from 'mongoose';
import { ApiError } from '../utils/apiError';
import { recordPaymentEntry } from './ledger.service';
import { startOfDay } from '../utils/date';
import { withTransaction } from '../utils/transaction';
import { assertInvoiceInOrg, tenantFilter } from '../utils/tenant';

function normalizeInvoiceStatus(invoice: { amountPaid: number; totalAmount: number; amountDue: number }) {
  if (invoice.amountPaid >= invoice.totalAmount) return 'paid';
  if (invoice.amountPaid > 0) return 'partially_paid';
  return 'unpaid';
}

export async function recordPayment(input: {
  organizationId: string;
  invoiceId: string;
  amount: number;
  paymentDate?: string | Date;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  userId: string;
  driverId?: string;
  collectionId?: string;
  settlementId?: string;
}) {
  return withTransaction(async (session) => {
    const invoice = await Invoice.findOne(
      tenantFilter(input.organizationId, { _id: input.invoiceId })
    ).session(session ?? null);
    if (!invoice) throw new ApiError(404, 'Invoice not found');
    if (invoice.status === 'void') throw new ApiError(400, 'Cannot pay a voided invoice');

    const currentDue = invoice.amountDue ?? invoice.totalAmount - (invoice.amountPaid ?? 0);
    if (input.amount > currentDue + 0.01) {
      throw new ApiError(400, `Payment exceeds amount due (₹${currentDue})`);
    }

    const [payment] = await Payment.create(
      [
        {
          organizationId: invoice.organizationId,
          invoiceId: invoice._id,
          customerId: invoice.customerId,
          driverId: input.driverId ? new Types.ObjectId(input.driverId) : undefined,
          collectionId: input.collectionId ? new Types.ObjectId(input.collectionId) : undefined,
          settlementId: input.settlementId ? new Types.ObjectId(input.settlementId) : undefined,
          amount: input.amount,
          paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
          paymentMethod: input.paymentMethod,
          referenceNumber: input.referenceNumber,
          notes: input.notes,
          createdBy: new Types.ObjectId(input.userId),
        },
      ],
      session ? { session } : undefined
    );

    invoice.amountPaid = (invoice.amountPaid ?? 0) + input.amount;
    invoice.amountDue = Math.max(0, invoice.totalAmount - invoice.amountPaid);
    invoice.status = normalizeInvoiceStatus(invoice) as typeof invoice.status;
    await invoice.save(session ? { session } : undefined);

    await recordPaymentEntry(
      invoice.customerId.toString(),
      input.amount,
      payment._id.toString(),
      input.referenceNumber || payment.paymentMethod.toUpperCase(),
      payment.paymentDate,
      input.userId,
      session
    );

    return payment.populate(['invoiceId', 'customerId', 'createdBy', 'driverId']);
  });
}

export async function listPayments(filters: {
  organizationId: string;
  customerId?: string;
  invoiceId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) {
  const query: Record<string, unknown> = tenantFilter(filters.organizationId);
  if (filters.customerId) query.customerId = new Types.ObjectId(filters.customerId);
  if (filters.invoiceId) query.invoiceId = new Types.ObjectId(filters.invoiceId);
  if (filters.from || filters.to) {
    query.paymentDate = {};
    if (filters.from) (query.paymentDate as Record<string, Date>).$gte = new Date(filters.from);
    if (filters.to) (query.paymentDate as Record<string, Date>).$lte = new Date(filters.to);
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 50;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Payment.find(query)
      .populate('invoiceId', 'invoiceNumber totalAmount')
      .populate('customerId', 'name shopName')
      .populate('createdBy', 'name')
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(query),
  ]);

  return { items, total, page, limit };
}

export async function getPaymentSummary(organizationId: string) {
  if (!organizationId) throw new ApiError(403, 'Organization context required');
  const today = startOfDay();
  const orgMatch = tenantFilter(organizationId);

  const [outstanding, paidAgg, recentPayments, overdueCount] = await Promise.all([
    Invoice.aggregate([
      { $match: { ...orgMatch, status: { $in: ['unpaid', 'partially_paid', 'pending'] } } },
      { $group: { _id: null, total: { $sum: '$amountDue' }, count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: orgMatch },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Payment.find(orgMatch)
      .populate('customerId', 'shopName')
      .populate('invoiceId', 'invoiceNumber')
      .sort({ paymentDate: -1 })
      .limit(10),
    Invoice.countDocuments({
      ...orgMatch,
      status: { $in: ['unpaid', 'partially_paid', 'pending'] },
      dueDate: { $lt: today },
    }),
  ]);

  const unpaidInvoices = await Invoice.aggregate([
    { $match: { ...orgMatch, status: { $in: ['unpaid', 'partially_paid', 'pending'] } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' }, paid: { $sum: '$amountPaid' } } },
  ]);

  return {
    totalOutstanding: outstanding[0]?.total ?? 0,
    outstandingInvoiceCount: outstanding[0]?.count ?? 0,
    totalPaid: paidAgg[0]?.total ?? 0,
    totalPaymentCount: paidAgg[0]?.count ?? 0,
    totalUnpaid: (unpaidInvoices[0]?.total ?? 0) - (unpaidInvoices[0]?.paid ?? 0),
    overdueCount,
    recentCollections: recentPayments,
  };
}
