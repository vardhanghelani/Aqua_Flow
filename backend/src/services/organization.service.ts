import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import {
  Organization,
  User,
  Area,
  Driver,
  Customer,
  Delivery,
  Invoice,
  Payment,
  LedgerEntry,
  DriverAreaAssignment,
  PriceHistory,
  InventorySettings,
  AnalyticsSettings,
  Expense,
  DriverCollection,
  DriverDailySettlement,
  CoolerTransaction,
  InventoryTransaction,
  AuditLog,
} from '../models';
import { ApiError } from '../utils/apiError';
import { slugifyBusinessName } from '../utils/organization';
import { AuthUser } from '../types';

const DEFAULT_PRICE = 20;

export async function resolveOrganizationForUser(userId: string): Promise<{
  organizationId: string;
  organizationName: string;
  isPrimaryOwner: boolean;
}> {
  const user = await User.findById(userId).select('organizationId role driverProfile isPrimaryOwner');
  if (!user) throw new ApiError(404, 'User not found');

  if (user.organizationId) {
    const org = await Organization.findById(user.organizationId);
    if (!org || !org.isActive) throw new ApiError(403, 'Organization inactive');
    return {
      organizationId: user.organizationId.toString(),
      organizationName: org.name,
      isPrimaryOwner: user.isPrimaryOwner ?? user.role === 'owner',
    };
  }

  if (user.role === 'driver' && user.driverProfile) {
    const driver = await Driver.findById(user.driverProfile).select('organizationId');
    if (driver?.organizationId) {
      const org = await Organization.findById(driver.organizationId);
      if (!org || !org.isActive) throw new ApiError(403, 'Organization inactive');
      await User.findByIdAndUpdate(userId, { organizationId: driver.organizationId });
      return {
        organizationId: driver.organizationId.toString(),
        organizationName: org.name,
        isPrimaryOwner: false,
      };
    }
  }

  const defaultOrg = await ensureDefaultOrganization();
  await User.findByIdAndUpdate(userId, { organizationId: defaultOrg._id });
  return {
    organizationId: defaultOrg._id.toString(),
    organizationName: defaultOrg.name,
    isPrimaryOwner: user.isPrimaryOwner ?? user.role === 'owner',
  };
}

export async function ensureDefaultOrganization() {
  let org = await Organization.findOne({ isDefault: true });
  if (!org) {
    org = await Organization.findOne();
  }
  if (!org) {
    org = await Organization.create({
      name: 'Default Business',
      slug: 'default-business',
      isActive: true,
      isDefault: true,
    });
  }
  return org;
}

export async function migrateOrphanedRecordsToOrg(orgId: Types.ObjectId) {
  const filter = { $or: [{ organizationId: { $exists: false } }, { organizationId: null }] };
  const set = { $set: { organizationId: orgId } };

  await Promise.all([
    User.updateMany(filter, set),
    Area.updateMany(filter, set),
    Driver.updateMany(filter, set),
    Customer.updateMany(filter, set),
    Delivery.updateMany(filter, set),
    Invoice.updateMany(filter, set),
    Payment.updateMany(filter, set),
    LedgerEntry.updateMany(filter, set),
    DriverAreaAssignment.updateMany(filter, set),
    PriceHistory.updateMany(filter, set),
    InventorySettings.updateMany(filter, set),
    AnalyticsSettings.updateMany(filter, set),
    Expense.updateMany(filter, set),
    DriverCollection.updateMany(filter, set),
    DriverDailySettlement.updateMany(filter, set),
    CoolerTransaction.updateMany(filter, set),
    InventoryTransaction.updateMany(filter, set),
    AuditLog.updateMany(filter, set),
  ]);
}

export async function runOrganizationBootstrap() {
  const org = await ensureDefaultOrganization();
  await migrateOrphanedRecordsToOrg(org._id);

  const usersWithoutOrg = await User.countDocuments({
    $or: [{ organizationId: { $exists: false } }, { organizationId: null }],
  });
  if (usersWithoutOrg > 0) {
    await User.updateMany(
      { $or: [{ organizationId: { $exists: false } }, { organizationId: null }] },
      { $set: { organizationId: org._id } }
    );
  }

  const inventoryCount = await InventorySettings.countDocuments({ organizationId: org._id });
  if (inventoryCount === 0) {
    const legacy = await InventorySettings.findOne({ organizationId: { $exists: false } });
    if (legacy) {
      legacy.organizationId = org._id;
      await legacy.save();
    } else {
      await InventorySettings.create({
        organizationId: org._id,
        totalCoolersOwned: 0,
        warehouseStock: 0,
      });
    }
  }

  const analyticsCount = await AnalyticsSettings.countDocuments({ organizationId: org._id });
  if (analyticsCount === 0) {
    const legacy = await AnalyticsSettings.findOne({ organizationId: { $exists: false } });
    if (legacy) {
      legacy.organizationId = org._id;
      await legacy.save();
    } else {
      await AnalyticsSettings.create({ organizationId: org._id });
    }
  }

  const priceCount = await PriceHistory.countDocuments({ organizationId: org._id });
  if (priceCount === 0) {
    const legacy = await PriceHistory.findOne({ organizationId: { $exists: false } });
    if (legacy) {
      legacy.organizationId = org._id;
      await legacy.save();
    }
  }
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugifyBusinessName(base);
  let attempt = 0;
  while (await Organization.findOne({ slug })) {
    attempt += 1;
    slug = `${slugifyBusinessName(base)}-${attempt}`;
  }
  return slug;
}

export async function provisionNewBusiness(input: {
  businessName: string;
  ownerName: string;
  loginId: string;
  password: string;
}) {
  const normalizedLogin = input.loginId.trim().toLowerCase();
  const exists = await User.findOne({ loginId: normalizedLogin });
  if (exists) throw new ApiError(409, 'Login ID already in use');

  const slug = await uniqueSlug(input.businessName);
  const org = await Organization.create({
    name: input.businessName.trim(),
    slug,
    isActive: true,
    isDefault: false,
  });

  const owner = await User.create({
    name: input.ownerName.trim(),
    loginId: normalizedLogin,
    password: await bcrypt.hash(input.password, 10),
    role: 'owner',
    organizationId: org._id,
    isPrimaryOwner: true,
    isActive: true,
  });

  await InventorySettings.create({
    organizationId: org._id,
    totalCoolersOwned: 0,
    warehouseStock: 0,
    inTransit: 0,
    inCirculation: 0,
    damagedStock: 0,
    lostStock: 0,
    updatedBy: owner._id,
  });

  await AnalyticsSettings.create({ organizationId: org._id });

  await PriceHistory.create({
    organizationId: org._id,
    price: DEFAULT_PRICE,
    effectiveFrom: new Date(),
    changedBy: owner._id,
  });

  return {
    organization: { id: org._id, name: org.name, slug: org.slug },
    owner: { id: owner._id, loginId: owner.loginId, name: owner.name },
  };
}

export async function listCoOwners(organizationId: string) {
  return User.find({
    organizationId,
    role: 'co_owner',
    isActive: true,
  })
    .select('name loginId createdAt isPrimaryOwner')
    .sort({ createdAt: 1 });
}

export async function createCoOwner(
  organizationId: string,
  createdBy: string,
  input: { name: string; loginId: string; password: string }
) {
  const normalizedLogin = input.loginId.trim().toLowerCase();
  const exists = await User.findOne({ loginId: normalizedLogin });
  if (exists) throw new ApiError(409, 'Login ID already in use');

  const user = await User.create({
    name: input.name.trim(),
    loginId: normalizedLogin,
    password: await bcrypt.hash(input.password, 10),
    role: 'co_owner',
    organizationId,
    isPrimaryOwner: false,
    isActive: true,
    createdBy,
  });

  return {
    id: user._id,
    name: user.name,
    loginId: user.loginId,
    role: user.role,
  };
}

export async function removeCoOwner(organizationId: string, userId: string) {
  const user = await User.findOne({ _id: userId, organizationId, role: 'co_owner' });
  if (!user) throw new ApiError(404, 'Co-owner not found');
  user.isActive = false;
  await user.save();
  return { message: 'Co-owner deactivated' };
}

export function enrichAuthUser(
  base: AuthUser,
  org: { organizationId: string; organizationName: string; isPrimaryOwner: boolean }
): AuthUser {
  return {
    ...base,
    organizationId: org.organizationId,
    organizationName: org.organizationName,
    isPrimaryOwner: org.isPrimaryOwner,
  };
}
