import { Types } from 'mongoose';
import { Expense, Delivery } from '../models';
import { ExpenseCategory } from '../models/Expense';
import { ApiError } from '../utils/apiError';
import { parseDateOnly, endOfDay } from '../utils/date';
import { assertExpenseInOrg, tenantFilter } from '../utils/tenant';

export async function createExpense(input: {
  organizationId: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expenseDate?: string | Date;
  referenceNumber?: string;
  notes?: string;
  userId: string;
}) {
  return Expense.create({
    organizationId: new Types.ObjectId(input.organizationId),
    category: input.category,
    description: input.description,
    amount: input.amount,
    expenseDate: input.expenseDate ? new Date(input.expenseDate) : new Date(),
    referenceNumber: input.referenceNumber,
    notes: input.notes,
    createdBy: new Types.ObjectId(input.userId),
  });
}

export async function listExpenses(filters: {
  organizationId: string;
  category?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) {
  const query: Record<string, unknown> = tenantFilter(filters.organizationId);
  if (filters.category) query.category = filters.category;
  if (filters.from || filters.to) {
    query.expenseDate = {};
    if (filters.from) (query.expenseDate as Record<string, Date>).$gte = parseDateOnly(filters.from);
    if (filters.to) (query.expenseDate as Record<string, Date>).$lte = endOfDay(parseDateOnly(filters.to));
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 50;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Expense.find(query).populate('createdBy', 'name').sort({ expenseDate: -1 }).skip(skip).limit(limit),
    Expense.countDocuments(query),
  ]);

  return { items, total, page, limit };
}

export async function getExpenseSummary(filters: { organizationId: string; from?: string; to?: string }) {
  const dateMatch: Record<string, Date> = {};
  if (filters.from) dateMatch.$gte = parseDateOnly(filters.from);
  if (filters.to) dateMatch.$lte = endOfDay(parseDateOnly(filters.to));

  const orgId = tenantFilter(filters.organizationId);
  const expenseMatch = Object.keys(dateMatch).length ? { ...orgId, expenseDate: dateMatch } : orgId;
  const deliveryMatch: Record<string, unknown> = { ...orgId, status: 'delivered' };
  if (Object.keys(dateMatch).length) deliveryMatch.deliveryDate = dateMatch;

  const [byCategory, expenseTotal, revenueTotal] = await Promise.all([
    Expense.aggregate([
      { $match: expenseMatch },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
    Expense.aggregate([{ $match: expenseMatch }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Delivery.aggregate([
      { $match: deliveryMatch },
      { $group: { _id: null, total: { $sum: '$billableAmount' } } },
    ]),
  ]);

  const totalExpenses = expenseTotal[0]?.total ?? 0;
  const totalRevenue = revenueTotal[0]?.total ?? 0;

  return {
    byCategory,
    totalExpenses,
    totalRevenue,
    profit: totalRevenue - totalExpenses,
    marginPercent: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
  };
}

export async function deleteExpense(id: string, organizationId: string) {
  const expense = await Expense.findOneAndDelete(tenantFilter(organizationId, { _id: id }));
  if (!expense) throw new ApiError(404, 'Expense not found');
  return expense;
}
