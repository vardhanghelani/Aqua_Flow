import mongoose from 'mongoose';

function isTransactionUnsupported(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('Transaction numbers are only allowed') ||
    msg.includes('replica set') ||
    msg.includes('mongos')
  );
}

/**
 * Runs fn inside a MongoDB transaction when supported; otherwise sequential (dev standalone).
 */
export async function withTransaction<T>(
  fn: (session: mongoose.ClientSession | null) => Promise<T>
): Promise<T> {
  let session: mongoose.ClientSession | null = null;
  try {
    session = await mongoose.startSession();
    let result: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result!;
  } catch (err) {
    if (session && isTransactionUnsupported(err)) {
      await session.endSession();
      return fn(null);
    }
    throw err;
  } finally {
    if (session?.inTransaction()) {
      await session.abortTransaction().catch(() => {});
    }
    if (session) await session.endSession();
  }
}
