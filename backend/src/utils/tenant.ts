import { Types } from 'mongoose';
import { Customer, Invoice, Driver, DriverDailySettlement, DriverCollection, Expense } from '../models';
import { ApiError } from '../utils/apiError';

export function tenantObjectId(organizationId: string): Types.ObjectId {
  return new Types.ObjectId(organizationId);
}

export function tenantFilter(organizationId: string, extra: Record<string, unknown> = {}) {
  return { organizationId: tenantObjectId(organizationId), ...extra };
}

export async function assertCustomerInOrg(customerId: string, organizationId: string) {
  const customer = await Customer.findOne(tenantFilter(organizationId, { _id: customerId }));
  if (!customer || customer.deletedAt) throw new ApiError(404, 'Customer not found');
  return customer;
}

export async function assertInvoiceInOrg(invoiceId: string, organizationId: string) {
  const invoice = await Invoice.findOne(tenantFilter(organizationId, { _id: invoiceId }));
  if (!invoice) throw new ApiError(404, 'Invoice not found');
  return invoice;
}

export async function assertDriverInOrg(driverId: string, organizationId: string) {
  const driver = await Driver.findOne(tenantFilter(organizationId, { _id: driverId }));
  if (!driver || driver.deletedAt) throw new ApiError(404, 'Driver not found');
  return driver;
}

export async function assertSettlementInOrg(id: string, organizationId: string) {
  const settlement = await DriverDailySettlement.findOne(tenantFilter(organizationId, { _id: id }));
  if (!settlement) throw new ApiError(404, 'Settlement not found');
  return settlement;
}

export async function assertCollectionInOrg(id: string, organizationId: string) {
  const collection = await DriverCollection.findOne(tenantFilter(organizationId, { _id: id }));
  if (!collection) throw new ApiError(404, 'Collection not found');
  return collection;
}

export async function assertExpenseInOrg(id: string, organizationId: string) {
  const expense = await Expense.findOne(tenantFilter(organizationId, { _id: id }));
  if (!expense) throw new ApiError(404, 'Expense not found');
  return expense;
}
