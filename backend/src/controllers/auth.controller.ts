import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { body } from 'express-validator';
import { User, Driver } from '../models';
import { AuthRequest } from '../types';
import { signToken } from '../utils/jwt';
import { ApiError } from '../utils/apiError';
import { logAudit } from '../middleware/audit';

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

    const authUser = {
      id: user._id.toString(),
      loginId: user.loginId,
      role: user.role,
      name: user.name,
      driverId: user.driverProfile?.toString(),
    };

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
    res.json({
      success: true,
      data: {
        id: user._id,
        loginId: user.loginId,
        role: user.role,
        name: user.name,
        driverId: user.driverProfile,
      },
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

export async function registerOwner(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new ApiError(403, 'Registration disabled in production');
    }
    const { name, loginId, password } = req.body;
    const normalized = normalizeLoginId(loginId);
    const exists = await User.findOne({ loginId: normalized });
    if (exists) throw new ApiError(409, 'Login ID already registered');

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      loginId: normalized,
      password: hashed,
      role: 'owner',
    });

    await logAudit(req, 'create', 'User', user._id.toString(), { loginId: normalized });
    res.status(201).json({ success: true, data: { id: user._id, loginId: user.loginId } });
  } catch (err) {
    next(err);
  }
}
