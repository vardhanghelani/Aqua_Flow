import { Delivery, Invoice, Customer, Payment } from '../models';
import { Types } from 'mongoose';
import { ApiError } from '../utils/apiError';
import { parseDateOnly, endOfDay } from '../utils/date';
import PDFDocument from 'pdfkit';
import { recordInvoiceEntry, recordInvoiceVoidEntry } from './ledger.service';
import { withTransaction } from '../utils/transaction';

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await Invoice.countDocuments({
    createdAt: { $gte: new Date(`${year}-01-01`) },
  });
  return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
}

export function deriveInvoiceStatus(invoice: {
  status: string;
  amountPaid: number;
  totalAmount: number;
}): 'unpaid' | 'partially_paid' | 'paid' | 'void' {
  if (invoice.status === 'void') return 'void';
  if (invoice.amountPaid >= invoice.totalAmount) return 'paid';
  if (invoice.amountPaid > 0) return 'partially_paid';
  return 'unpaid';
}

export async function syncInvoiceStatusFromPayments(invoiceId: string) {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice || invoice.status === 'void') return invoice;

  const paidAgg = await Payment.aggregate([
    { $match: { invoiceId: invoice._id } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  invoice.amountPaid = paidAgg[0]?.total ?? 0;
  invoice.amountDue = Math.max(0, invoice.totalAmount - invoice.amountPaid);
  invoice.status = deriveInvoiceStatus(invoice);
  await invoice.save();
  return invoice;
}

export async function generateInvoice(input: {
  customerId: string;
  periodStart: string;
  periodEnd: string;
  invoiceType: 'monthly' | 'weekly' | 'custom';
  userId: string;
}) {
  return withTransaction(async (session) => {
    const customer = await Customer.findById(input.customerId).session(session ?? null);
    if (!customer) throw new ApiError(404, 'Customer not found');

    const periodStart = parseDateOnly(input.periodStart);
    const periodEnd = endOfDay(parseDateOnly(input.periodEnd));

    const existing = await Invoice.findOne({
      customerId: customer._id,
      periodStart,
      periodEnd,
      status: { $ne: 'void' },
    }).session(session ?? null);
    if (existing) {
      throw new ApiError(409, 'Invoice already exists for this period');
    }

    const deliveries = await Delivery.find({
      customerId: customer._id,
      status: 'delivered',
      deliveryDate: { $gte: periodStart, $lte: periodEnd },
      filledGiven: { $gt: 0 },
    })
      .sort({ deliveryDate: 1 })
      .session(session ?? null);

    if (deliveries.length === 0) {
      throw new ApiError(400, 'No billable deliveries in selected period');
    }

    const items = deliveries.map((d) => ({
      deliveryId: d._id,
      date: d.deliveryDate,
      quantity: d.filledGiven,
      unitPrice: d.unitPrice,
      amount: d.billableAmount,
    }));

    const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);
    const totalAmount = items.reduce((s, i) => s + i.amount, 0);

    const dueDate = new Date(periodEnd);
    dueDate.setDate(dueDate.getDate() + 15);

    const [invoice] = await Invoice.create(
      [
        {
          invoiceNumber: await generateInvoiceNumber(),
          customerId: customer._id,
          periodStart,
          periodEnd,
          invoiceType: input.invoiceType,
          items,
          totalQuantity,
          totalAmount,
          amountPaid: 0,
          amountDue: totalAmount,
          status: 'unpaid',
          dueDate,
          generatedBy: new Types.ObjectId(input.userId),
        },
      ],
      session ? { session } : undefined
    );

    await recordInvoiceEntry(
      customer._id.toString(),
      totalAmount,
      invoice._id.toString(),
      invoice.invoiceNumber,
      new Date(),
      input.userId,
      session
    );

    return invoice.populate(['customerId', 'generatedBy']);
  });
}

export async function voidInvoice(id: string, userId: string) {
  return withTransaction(async (session) => {
    const invoice = await Invoice.findById(id).session(session ?? null);
    if (!invoice) throw new ApiError(404, 'Invoice not found');
    if (invoice.status === 'void') throw new ApiError(400, 'Invoice already voided');
    if ((invoice.amountPaid ?? 0) > 0) {
      throw new ApiError(400, 'Cannot void invoice with payments — reverse payments first');
    }

    await recordInvoiceVoidEntry(
      invoice.customerId.toString(),
      invoice.totalAmount,
      invoice._id.toString(),
      invoice.invoiceNumber,
      userId,
      session
    );

    invoice.status = 'void';
    invoice.amountDue = 0;
    await invoice.save(session ? { session } : undefined);

    return invoice;
  });
}

export async function listInvoices(filters: {
  customerId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const query: Record<string, unknown> = {};
  if (filters.customerId) query.customerId = new Types.ObjectId(filters.customerId);
  if (filters.status) query.status = filters.status;

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Invoice.find(query)
      .populate('customerId', 'name shopName mobile address')
      .populate('generatedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Invoice.countDocuments(query),
  ]);

  return { items, total, page, limit };
}

export async function getInvoiceById(id: string) {
  const invoice = await Invoice.findById(id)
    .populate('customerId', 'name shopName mobile address')
    .populate('generatedBy', 'name');
  if (!invoice) throw new ApiError(404, 'Invoice not found');
  return invoice;
}

export function getInvoiceShareInfo(invoice: Awaited<ReturnType<typeof getInvoiceById>>) {
  const customer = invoice.customerId as unknown as { name: string; shopName: string; mobile: string };
  const period = `${invoice.periodStart.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`;
  const message = `Hello ${customer.name},\n\nYour invoice for ${period} is ready.\n\nInvoice: ${invoice.invoiceNumber}\nAmount: ₹${invoice.totalAmount}\nDue: ₹${invoice.amountDue ?? invoice.totalAmount}\n\nThank you.\n— Aqua Flow`;
  const phone = customer.mobile?.replace(/\D/g, '');
  const whatsappUrl = phone
    ? `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  return {
    invoiceNumber: invoice.invoiceNumber,
    shareMessage: message,
    whatsappUrl,
    pdfUrl: `/api/invoices/${invoice._id}/pdf`,
    amount: invoice.totalAmount,
    amountDue: invoice.amountDue ?? invoice.totalAmount,
    customerName: customer.name,
    shopName: customer.shopName,
    mobile: customer.mobile,
  };
}

export function generateInvoicePdf(invoice: Awaited<ReturnType<typeof getInvoiceById>>): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 50 });
  const customer = invoice.customerId as unknown as {
    name: string;
    shopName: string;
    mobile: string;
    address: string;
  };

  doc.fontSize(20).text('Aqua Flow', { align: 'center' });
  doc.fontSize(12).text('Water Cooler Distribution', { align: 'center' });
  doc.moveDown();
  doc.fontSize(16).text(`Invoice: ${invoice.invoiceNumber}`);
  doc.fontSize(10).text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`);
  doc.text(`Period: ${invoice.periodStart.toLocaleDateString('en-IN')} - ${invoice.periodEnd.toLocaleDateString('en-IN')}`);
  doc.moveDown();
  doc.text(`Customer: ${customer.name}`);
  doc.text(`Shop: ${customer.shopName}`);
  doc.text(`Mobile: ${customer.mobile}`);
  doc.text(`Address: ${customer.address}`);
  doc.moveDown();

  doc.fontSize(12).text('Delivery Summary', { underline: true });
  doc.moveDown(0.5);

  invoice.items.forEach((item) => {
    doc.fontSize(10).text(
      `${item.date.toLocaleDateString('en-IN')} | Qty: ${item.quantity} | Rate: ₹${item.unitPrice} | Amount: ₹${item.amount}`
    );
  });

  doc.moveDown();
  doc.fontSize(12).text(`Total Quantity: ${invoice.totalQuantity}`);
  doc.fontSize(14).text(`Total Amount: ₹${invoice.totalAmount}`, { align: 'right' });
  doc.fontSize(10).text(`Status: ${invoice.status.toUpperCase()}`, { align: 'right' });

  doc.end();
  return doc;
}
