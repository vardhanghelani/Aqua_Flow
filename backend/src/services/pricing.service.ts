import { PriceHistory } from '../models';
import { Types } from 'mongoose';

export async function getCurrentPrice(organizationId: string): Promise<number> {
  const orgFilter = { organizationId: new Types.ObjectId(organizationId) };
  const current = await PriceHistory.findOne({ ...orgFilter, effectiveTo: null }).sort({ effectiveFrom: -1 });
  return current?.price ?? 20;
}

export async function getPriceAtDate(organizationId: string, date: Date): Promise<number> {
  const orgFilter = { organizationId: new Types.ObjectId(organizationId) };
  const record = await PriceHistory.findOne({
    ...orgFilter,
    effectiveFrom: { $lte: date },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gt: date } }],
  }).sort({ effectiveFrom: -1 });
  return record?.price ?? 20;
}

export async function setNewPrice(organizationId: string, price: number, userId: string): Promise<void> {
  const orgId = new Types.ObjectId(organizationId);
  const now = new Date();
  await PriceHistory.updateMany({ organizationId: orgId, effectiveTo: null }, { effectiveTo: now });
  await PriceHistory.create({
    organizationId: orgId,
    price,
    effectiveFrom: now,
    changedBy: new Types.ObjectId(userId),
  });
}

export async function getPriceHistory(organizationId: string) {
  return PriceHistory.find({ organizationId })
    .populate('changedBy', 'name loginId')
    .sort({ effectiveFrom: -1 });
}
