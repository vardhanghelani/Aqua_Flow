import { PriceHistory } from '../models';
import { Types } from 'mongoose';

export async function getCurrentPrice(): Promise<number> {
  const current = await PriceHistory.findOne({ effectiveTo: null }).sort({ effectiveFrom: -1 });
  return current?.price ?? 20;
}

export async function getPriceAtDate(date: Date): Promise<number> {
  const record = await PriceHistory.findOne({
    effectiveFrom: { $lte: date },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gt: date } }],
  }).sort({ effectiveFrom: -1 });
  return record?.price ?? 20;
}

export async function setNewPrice(price: number, userId: string): Promise<void> {
  const now = new Date();
  await PriceHistory.updateMany({ effectiveTo: null }, { effectiveTo: now });
  await PriceHistory.create({
    price,
    effectiveFrom: now,
    changedBy: new Types.ObjectId(userId),
  });
}

export async function getPriceHistory() {
  return PriceHistory.find().populate('changedBy', 'name loginId').sort({ effectiveFrom: -1 });
}
