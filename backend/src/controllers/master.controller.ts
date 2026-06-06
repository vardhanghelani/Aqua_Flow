import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { body, param } from 'express-validator';
import { Area, Driver, Customer, User, DriverAreaAssignment } from '../models';
import { AuthRequest } from '../types';
import { ApiError } from '../utils/apiError';
import { logAudit } from '../middleware/audit';
import { notDeletedFilter, softDeleteDoc } from '../utils/softDelete';
import { pickFields } from '../utils/sanitize';

const AREA_UPDATE_FIELDS = ['name', 'description', 'isActive'] as const;
const DRIVER_UPDATE_FIELDS = ['name', 'mobile', 'isActive'] as const;
const CUSTOMER_UPDATE_FIELDS = [
  'name', 'shopName', 'mobile', 'address', 'areaId', 'customPrice', 'status',
  'latitude', 'longitude', 'googleMapsUrl', 'locationNotes',
] as const;
const CUSTOMER_CREATE_FIELDS = [...CUSTOMER_UPDATE_FIELDS] as const;

// Areas
export const areaValidation = [body('name').notEmpty().withMessage('Area name required')];

export async function listAreas(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const areas = await Area.find(notDeletedFilter(includeDeleted)).sort({ name: 1 });
    res.json({ success: true, data: areas });
  } catch (err) {
    next(err);
  }
}

export async function createArea(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const area = await Area.create({
      ...pickFields(req.body, AREA_UPDATE_FIELDS),
      createdBy: req.user!.id,
    });
    await logAudit(req, 'create', 'Area', area._id.toString(), req.body);
    res.status(201).json({ success: true, data: area });
  } catch (err) {
    next(err);
  }
}

export async function updateArea(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const area = await Area.findByIdAndUpdate(
      req.params.id,
      { ...pickFields(req.body, AREA_UPDATE_FIELDS), updatedBy: req.user!.id },
      { new: true, runValidators: true }
    );
    if (!area) throw new ApiError(404, 'Area not found');
    await logAudit(req, 'update', 'Area', area._id.toString(), req.body);
    res.json({ success: true, data: area });
  } catch (err) {
    next(err);
  }
}

export async function deleteArea(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const customers = await Customer.countDocuments({ areaId: req.params.id, ...notDeletedFilter() });
    if (customers > 0) throw new ApiError(400, 'Cannot delete area with active customers');
    const area = await Area.findById(req.params.id);
    if (!area || area.deletedAt) throw new ApiError(404, 'Area not found');
    await softDeleteDoc(area, req.user!.id);
    await logAudit(req, 'delete', 'Area', req.params.id);
    res.json({ success: true, message: 'Area archived' });
  } catch (err) {
    next(err);
  }
}

// Drivers
export const driverValidation = [
  body('name').notEmpty(),
  body('mobile').notEmpty(),
  body('loginId').optional().isString().trim().notEmpty(),
  body('password').optional().isLength({ min: 6 }),
];

export const driverUpdateValidation = [
  body('name').optional().notEmpty(),
  body('mobile').optional().notEmpty(),
  body('loginId').optional().isString().trim().notEmpty(),
  body('password').optional().isLength({ min: 6 }),
  body('isActive').optional().isBoolean(),
];

export async function listDrivers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const drivers = await Driver.find(notDeletedFilter(includeDeleted))
      .populate('userId', 'loginId isActive')
      .sort({ name: 1 });
    res.json({ success: true, data: drivers });
  } catch (err) {
    next(err);
  }
}

export async function createDriver(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, mobile, loginId, password } = req.body;
    let userId;

    if (loginId && password) {
      const normalized = String(loginId).trim().toLowerCase();
      const exists = await User.findOne({ loginId: normalized });
      if (exists) throw new ApiError(409, 'Login ID already in use');
      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        loginId: normalized,
        password: hashed,
        role: 'driver',
        createdBy: req.user!.id,
      });
      userId = user._id;
    }

    const driver = await Driver.create({
      name,
      mobile,
      userId,
      createdBy: req.user!.id,
    });

    if (userId) {
      await User.findByIdAndUpdate(userId, { driverProfile: driver._id });
    }

    await logAudit(req, 'create', 'Driver', driver._id.toString(), { name, mobile });
    res.status(201).json({ success: true, data: driver });
  } catch (err) {
    next(err);
  }
}

export async function updateDriver(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver || driver.deletedAt) throw new ApiError(404, 'Driver not found');

    const { loginId, password } = req.body;

    Object.assign(driver, pickFields(req.body, DRIVER_UPDATE_FIELDS));
    driver.updatedBy = new Types.ObjectId(req.user!.id);
    await driver.save();

    if (driver.userId) {
      const userUpdates: Record<string, unknown> = {};
      if (req.body.name) userUpdates.name = req.body.name;
      if (typeof req.body.isActive === 'boolean') userUpdates.isActive = req.body.isActive;

      if (loginId) {
        const normalized = String(loginId).trim().toLowerCase();
        const exists = await User.findOne({ loginId: normalized, _id: { $ne: driver.userId } });
        if (exists) throw new ApiError(409, 'Login ID already in use');
        userUpdates.loginId = normalized;
      }
      if (password) {
        userUpdates.password = await bcrypt.hash(String(password), 10);
      }
      if (Object.keys(userUpdates).length > 0) {
        await User.findByIdAndUpdate(driver.userId, userUpdates);
      }
    } else if (loginId && password) {
      const normalized = String(loginId).trim().toLowerCase();
      const exists = await User.findOne({ loginId: normalized });
      if (exists) throw new ApiError(409, 'Login ID already in use');
      const user = await User.create({
        name: driver.name,
        loginId: normalized,
        password: await bcrypt.hash(String(password), 10),
        role: 'driver',
        createdBy: req.user!.id,
      });
      driver.userId = user._id;
      user.driverProfile = driver._id;
      await user.save();
      await driver.save();
    }

    await logAudit(req, 'update', 'Driver', driver._id.toString(), req.body);
    const updated = await Driver.findById(driver._id).populate('userId', 'loginId isActive');
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteDriver(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver || driver.deletedAt) throw new ApiError(404, 'Driver not found');

    await DriverAreaAssignment.updateMany(
      { driverId: driver._id, isActive: true },
      { isActive: false, endDate: new Date(), updatedBy: req.user!.id }
    );

    driver.isActive = false;
    await softDeleteDoc(driver, req.user!.id);

    if (driver.userId) {
      await User.findByIdAndUpdate(driver.userId, { isActive: false });
    }

    await logAudit(req, 'delete', 'Driver', req.params.id);
    res.json({ success: true, message: 'Driver removed' });
  } catch (err) {
    next(err);
  }
}

// Customers
export const customerValidation = [
  body('name').notEmpty(),
  body('shopName').notEmpty(),
  body('mobile').notEmpty(),
  body('address').notEmpty(),
  body('areaId').notEmpty(),
];

export async function listCustomers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const query: Record<string, unknown> = { ...notDeletedFilter(includeDeleted) };
    if (req.query.areaId) query.areaId = req.query.areaId;
    if (req.query.status) query.status = req.query.status;

    const customers = await Customer.find(query).populate('areaId', 'name').sort({ shopName: 1 });
    res.json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
}

export async function createCustomer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const customer = await Customer.create({
      ...pickFields(req.body, CUSTOMER_CREATE_FIELDS),
      createdBy: req.user!.id,
    });
    await logAudit(req, 'create', 'Customer', customer._id.toString(), req.body);
    res.status(201).json({ success: true, data: await customer.populate('areaId', 'name') });
  } catch (err) {
    next(err);
  }
}

export async function updateCustomer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { ...pickFields(req.body, CUSTOMER_UPDATE_FIELDS), updatedBy: req.user!.id },
      { new: true, runValidators: true }
    ).populate('areaId', 'name');
    if (!customer || customer.deletedAt) throw new ApiError(404, 'Customer not found');
    await logAudit(req, 'update', 'Customer', customer._id.toString(), req.body);
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
}

export async function deleteCustomer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer || customer.deletedAt) throw new ApiError(404, 'Customer not found');
    customer.status = 'inactive';
    await softDeleteDoc(customer, req.user!.id);
    await logAudit(req, 'delete', 'Customer', req.params.id);
    res.json({ success: true, message: 'Customer removed' });
  } catch (err) {
    next(err);
  }
}

export async function getCustomerById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const customer = await Customer.findById(req.params.id).populate('areaId', 'name');
    if (!customer) throw new ApiError(404, 'Customer not found');
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
}

export async function getCustomerAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { computeCustomerAnalytics } = await import('../services/customerAnalytics.service');
    const data = await computeCustomerAnalytics(req.params.id);
    if (!data) throw new ApiError(404, 'Customer not found');
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export const idParam = [param('id').isMongoId()];
