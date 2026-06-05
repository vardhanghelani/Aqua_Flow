import { Schema } from 'mongoose';

export const softDeleteFields = {
  deletedAt: { type: Date, default: null },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
};

export function notDeletedFilter(includeDeleted = false) {
  return includeDeleted ? {} : { deletedAt: null };
}

export async function softDeleteDoc<T extends { deletedAt?: Date | null; deletedBy?: unknown; save: () => Promise<T> }>(
  doc: T,
  userId?: string
): Promise<T> {
  doc.deletedAt = new Date();
  if (userId) doc.deletedBy = userId as never;
  return doc.save();
}

export async function restoreDoc<T extends { deletedAt?: Date | null; deletedBy?: unknown; save: () => Promise<T> }>(
  doc: T
): Promise<T> {
  doc.deletedAt = null;
  doc.deletedBy = undefined;
  return doc.save();
}
