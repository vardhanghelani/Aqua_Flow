import { Types } from 'mongoose';
import {
  Customer,
  Delivery,
  Payment,
  Invoice,
  LedgerEntry,
  CoolerTransaction,
} from '../models';
import { ApiError } from '../utils/apiError';
import { computeCustomerAnalytics } from './customerAnalytics.service';
import { getCustomerCredit } from './credit.service';

export async function getCustomer360(customerId: string) {
  const customer = await Customer.findOne({ _id: customerId, deletedAt: null }).populate('areaId', 'name');
  if (!customer) throw new ApiError(404, 'Customer not found');

  const oid = new Types.ObjectId(customerId);

  const [analytics, credit, recentDeliveries, recentPayments, recentInvoices, ledgerRecent, coolerRecent] =
    await Promise.all([
      computeCustomerAnalytics(customerId),
      getCustomerCredit(customerId),
      Delivery.find({ customerId: oid })
        .populate('driverId', 'name')
        .sort({ deliveryDate: -1 })
        .limit(20),
      Payment.find({ customerId: oid })
        .populate('invoiceId', 'invoiceNumber')
        .populate('driverId', 'name')
        .sort({ paymentDate: -1 })
        .limit(20),
      Invoice.find({ customerId: oid }).sort({ createdAt: -1 }).limit(20),
      LedgerEntry.find({ customerId: oid }).sort({ date: -1, createdAt: -1 }).limit(30),
      CoolerTransaction.find({ customerId: oid })
        .populate('driverId', 'name')
        .sort({ createdAt: -1 })
        .limit(30),
    ]);

  const timeline = [
    ...recentDeliveries.map((d) => ({
      type: 'delivery' as const,
      date: d.deliveryDate,
      title: d.status === 'delivered' ? `Delivered ${d.filledGiven} filled` : 'Not delivered',
      amount: d.billableAmount,
      meta: { driverId: d.driverId, status: d.status },
    })),
    ...recentPayments.map((p) => ({
      type: 'payment' as const,
      date: p.paymentDate,
      title: `Payment via ${p.paymentMethod}`,
      amount: p.amount,
      meta: { invoiceId: p.invoiceId },
    })),
    ...recentInvoices.map((i) => ({
      type: 'invoice' as const,
      date: i.createdAt,
      title: `Invoice ${i.invoiceNumber}`,
      amount: i.totalAmount,
      meta: { status: i.status, amountDue: i.amountDue },
    })),
    ...coolerRecent.map((c) => ({
      type: 'cooler' as const,
      date: c.createdAt,
      title: `Cooler ${c.type}: ${c.quantity}`,
      amount: 0,
      meta: { driverId: c.driverId },
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    customer,
    analytics,
    credit,
    deliveries: recentDeliveries,
    payments: recentPayments,
    invoices: recentInvoices,
    ledger: ledgerRecent,
    coolerTransactions: coolerRecent,
    timeline: timeline.slice(0, 50),
  };
}
