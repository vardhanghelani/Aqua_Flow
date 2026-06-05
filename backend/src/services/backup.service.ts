import mongoose from 'mongoose';

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
  'organizations',
  'driverdailysettlements',
  'drivercollections',
  'expenses',
] as const;

const USER_SAFE_FIELDS = {
  _id: 1,
  name: 1,
  email: 1,
  role: 1,
  isActive: 1,
  driverProfile: 1,
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

export async function exportDatabase() {
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database not connected');

  const exportData: Record<string, unknown> = {
    _meta: {
      exportedAt: new Date().toISOString(),
      version: 'remediation-v1',
      note: 'Users exported without password hashes. Restore passwords separately.',
    },
  };

  for (const name of EXPORT_COLLECTIONS) {
    try {
      const docs = await db.collection(name).find({}).toArray();
      exportData[name] = docs;
    } catch {
      exportData[name] = [];
    }
  }

  try {
    const users = await db.collection('users').find({}).toArray();
    exportData.users = users.map((u) => sanitizeUserDoc(u as Record<string, unknown>));
  } catch {
    exportData.users = [];
  }

  return exportData;
}

export const RECOVERY_DOCS = {
  title: 'Aqua Flow Backup & Recovery',
  steps: [
    '1. Stop the application server to prevent writes during restore.',
    '2. Export via GET /api/backup/export — users exclude password hashes.',
    '3. Production: use mongodump/mongorestore for full BSON backup.',
    '4. After restore: npm run migrate:phase2 && migrate:phase3 && migrate:ledger',
    '5. Reset user passwords via admin — hashes are NOT in JSON export.',
    '6. Verify /api/health and ledger consistency.',
  ],
  security: {
    excludedFromExport: ['password', 'refreshToken', 'passwordHash', 'JWT secrets'],
    usersExport: 'Safe fields only (no password)',
  },
  collections: [...EXPORT_COLLECTIONS, 'users (sanitized)'],
};
