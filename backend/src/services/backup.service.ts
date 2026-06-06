import mongoose from 'mongoose';
import { Types } from 'mongoose';

const EXPORT_COLLECTIONS = [
  'areas',
  'drivers',
  'customers',
  'driverareaassignments',
  'deliveries',
  'pricehistories',
  'inventorysettings',
  'inventorytransactions',
  'invoices',
  'auditlogs',
  'coolertransactions',
  'payments',
  'ledgerentries',
  'analyticssettings',
  'driverdailysettlements',
  'drivercollections',
  'expenses',
] as const;

const USER_SAFE_FIELDS = {
  _id: 1,
  name: 1,
  loginId: 1,
  role: 1,
  isActive: 1,
  driverProfile: 1,
  organizationId: 1,
  createdAt: 1,
  updatedAt: 1,
};

export function sanitizeUserDoc(doc: Record<string, unknown>) {
  const safe: Record<string, unknown> = {};
  for (const key of Object.keys(USER_SAFE_FIELDS)) {
    if (doc[key] !== undefined) safe[key] = doc[key];
  }
  return safe;
}

/** Export only data belonging to one organization (never cross-tenant). */
export async function exportDatabase(organizationId: string) {
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database not connected');

  const orgId = new Types.ObjectId(organizationId);

  const exportData: Record<string, unknown> = {
    _meta: {
      exportedAt: new Date().toISOString(),
      organizationId,
      version: 'tenant-scoped-v1',
      note: 'Users exported without password hashes. Restore passwords separately.',
    },
  };

  for (const name of EXPORT_COLLECTIONS) {
    try {
      const docs = await db.collection(name).find({ organizationId: orgId }).toArray();
      exportData[name] = docs;
    } catch {
      exportData[name] = [];
    }
  }

  try {
    const users = await db.collection('users').find({ organizationId: orgId }).toArray();
    exportData.users = users.map((u) => sanitizeUserDoc(u as Record<string, unknown>));
  } catch {
    exportData.users = [];
  }

  try {
    const org = await db.collection('organizations').findOne({ _id: orgId });
    exportData.organization = org ? [org] : [];
  } catch {
    exportData.organization = [];
  }

  return exportData;
}

export const RECOVERY_DOCS = {
  title: 'Aqua Flow Backup & Recovery',
  steps: [
    '1. Stop the application server to prevent writes during restore.',
    '2. Export via GET /api/backup/export — scoped to your organization only.',
    '3. Production: use mongodump/mongorestore for full BSON backup.',
    '4. After restore: run organization bootstrap migration.',
    '5. Reset user passwords via admin — hashes are NOT in JSON export.',
    '6. Verify /api/health and ledger consistency.',
  ],
  security: {
    excludedFromExport: ['password', 'refreshToken', 'passwordHash', 'JWT secrets', 'other organizations data'],
    usersExport: 'Safe fields only (no password), same organization only',
  },
  collections: [...EXPORT_COLLECTIONS, 'users (sanitized)', 'organization'],
};
