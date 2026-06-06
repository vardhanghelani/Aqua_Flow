import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { body, param } from 'express-validator';
import { User, Driver } from '../models';
import { AuthRequest } from '../types';
import { signToken } from '../utils/jwt';
import { ApiError } from '../utils/apiError';
import { logAudit } from '../middleware/audit';
import {
  resolveOrganizationForUser,
  enrichAuthUser,
  listCoOwners,
  createCoOwner,
  removeCoOwner,
} from '../services/organization.service';

function normalizeLoginId(value: string): string {
  return value.trim().toLowerCase();
}

export const loginValidation = [
  body('loginId').notEmpty().withMessage('Login ID required'),
  body('password').notEmpty().withMessage('Password required'),
];

export async function login(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { loginId, password } = req.body;
    const user = await User.findOne({ loginId: normalizeLoginId(loginId) });
    if (!user || !user.isActive) throw new ApiError(401, 'Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new ApiError(401, 'Invalid credentials');

    const org = await resolveOrganizationForUser(user._id.toString());

    const authUser = enrichAuthUser(
      {
        id: user._id.toString(),
        loginId: user.loginId,
        role: user.role,
        name: user.name,
        driverId: user.driverProfile?.toString(),
      },
      org
    );

    const token = signToken(authUser);
    res.json({ success: true, data: { user: authUser, token } });
  } catch (err) {
    next(err);
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user!.id).select('-password');
    if (!user) throw new ApiError(404, 'User not found');

    const org = await resolveOrganizationForUser(user._id.toString());

    res.json({
      success: true,
      data: enrichAuthUser(
        {
          id: user._id.toString(),
          loginId: user.loginId,
          role: user.role,
          name: user.name,
          driverId: user.driverProfile?.toString(),
        },
        org
      ),
    });
  } catch (err) {
    next(err);
  }
}

export const registerOwnerValidation = [
  body('name').notEmpty(),
  body('loginId').notEmpty(),
  body('password').isLength({ min: 6 }),
];

/** Dev-only legacy register (single tenant). Prefer /api/provision/business in production. */
export async function registerOwner(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new ApiError(403, 'Registration disabled in production');
    }
    const { name, loginId, password } = req.body;
    const normalized = normalizeLoginId(loginId);
    const exists = await User.findOne({ loginId: normalized });
    if (exists) throw new ApiError(409, 'Login ID already registered');

    const { ensureDefaultOrganization } = await import('../services/organization.service');
    const org = await ensureDefaultOrganization();

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      loginId: normalized,
      password: hashed,
      role: 'owner',
      organizationId: org._id,
      isPrimaryOwner: true,
    });

    await logAudit(req, 'create', 'User', user._id.toString(), { loginId: normalized });
    res.status(201).json({ success: true, data: { id: user._id, loginId: user.loginId } });
  } catch (err) {
    next(err);
  }
}

export const coOwnerValidation = [
  body('name').notEmpty(),
  body('loginId').notEmpty(),
  body('password').isLength({ min: 6 }),
];

export async function listCoOwnersHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const orgId = req.user!.organizationId!;
    const items = await listCoOwners(orgId);
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

export async function createCoOwnerHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const orgId = req.user!.organizationId!;
    const data = await createCoOwner(orgId, req.user!.id, req.body);
    await logAudit(req, 'create', 'User', data.id.toString(), { role: 'co_owner', loginId: data.loginId });
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function removeCoOwnerHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const orgId = req.user!.organizationId!;
    const result = await removeCoOwner(orgId, req.params.id);
    await logAudit(req, 'delete', 'User', req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
