import { Types } from 'mongoose';
import { Customer, Invoice } from '../models';
import { ApiError } from '../utils/apiError';
import { startOfDay } from '../utils/date';
import { getUninvoicedBillableTotal } from './ledger.service';

export function getEffectiveCreditLimit(customer: {
  creditLimit: number;
  creditOverride?: number;
}) {
  if (customer.creditOverride !== undefined && customer.creditOverride !== null) {
    return customer.creditOverride;
  }
  return customer.creditLimit ?? 0;
}

export function checkCreditStatus(customer: {
  creditLimit: number;
  creditOverride?: number;
  ledgerBalance: number;
}) {
  const effectiveLimit = getEffectiveCreditLimit(customer);
  const outstanding = customer.ledgerBalance ?? 0;

  if (effectiveLimit <= 0) {
    return {
      effectiveLimit: 0,
      outstanding,
      availableCredit: null,
      status: 'no_limit' as const,
      utilizationPercent: null,
      isOverLimit: false,
      isNearLimit: false,
    };
  }

  const availableCredit = Math.max(0, effectiveLimit - outstanding);
  const utilizationPercent = (outstanding / effectiveLimit) * 100;

  return {
    effectiveLimit,
    outstanding,
    availableCredit,
    status: outstanding > effectiveLimit ? 'over_limit' : utilizationPercent >= 80 ? 'warning' : 'ok',
    utilizationPercent,
    isOverLimit: outstanding > effectiveLimit,
    isNearLimit: utilizationPercent >= 80 && outstanding <= effectiveLimit,
  };
}

export async function getCustomerCredit(customerId: string) {
  const customer = await Customer.findById(customerId);
  if (!customer) throw new ApiError(404, 'Customer not found');

  const credit = checkCreditStatus(customer);
  const today = startOfDay();
  const overdueInvoices = await Invoice.find({
    customerId: customer._id,
    status: { $in: ['unpaid', 'partially_paid', 'pending'] },
    dueDate: { $lt: today },
  }).select('invoiceNumber amountDue dueDate');

  return {
    customerId: customer._id,
    creditLimit: customer.creditLimit,
    creditOverride: customer.creditOverride,
    creditOverrideReason: customer.creditOverrideReason,
    ...credit,
    overdueInvoices,
    overdueCount: overdueInvoices.length,
    overdueAmount: overdueInvoices.reduce((s, i) => s + (i.amountDue ?? 0), 0),
  };
}

export async function updateCustomerCredit(
  customerId: string,
  input: {
    creditLimit?: number;
    creditOverride?: number | null;
    creditOverrideReason?: string;
    userId: string;
  }
) {
  const customer = await Customer.findById(customerId);
  if (!customer) throw new ApiError(404, 'Customer not found');

  if (input.creditLimit !== undefined) customer.creditLimit = input.creditLimit;
  if (input.creditOverride !== undefined) {
    customer.creditOverride = input.creditOverride === null ? undefined : input.creditOverride;
    customer.creditOverrideBy = new Types.ObjectId(input.userId);
    customer.creditOverrideReason = input.creditOverrideReason;
  }

  await customer.save();
  return getCustomerCredit(customerId);
}

export async function validateDeliveryCredit(customerId: string, additionalCharge: number) {
  const customer = await Customer.findById(customerId);
  if (!customer) throw new ApiError(404, 'Customer not found');

  const uninvoiced = await getUninvoicedBillableTotal(customerId);
  const credit = checkCreditStatus(customer);
  if (credit.effectiveLimit <= 0) return { allowed: true, warning: false, credit, uninvoiced };

  const projected = credit.outstanding + uninvoiced + additionalCharge;
  if (projected > credit.effectiveLimit) {
    return {
      allowed: false,
      warning: true,
      credit,
      message: `Credit limit exceeded. Limit: ₹${credit.effectiveLimit}, projected: ₹${projected}`,
    };
  }

  const warning = projected / credit.effectiveLimit >= 0.8;
  return { allowed: true, warning, credit };
}
