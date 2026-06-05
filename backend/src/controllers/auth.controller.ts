import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { body } from 'express-validator';
import { User, Driver } from '../models';
import { AuthRequest } from '../types';
import { signToken } from '../utils/jwt';
import { ApiError } from '../utils/apiError';
import { logAudit } from '../middleware/audit';

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

export async function login(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) throw new ApiError(401, 'Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new ApiError(401, 'Invalid credentials');

    const authUser = {
      id: user._id.toString(),
      email: user.email,
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
        email: user.email,
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
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
];

export async function registerOwner(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new ApiError(403, 'Registration disabled in production');
    }
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) throw new ApiError(409, 'Email already registered');

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role: 'owner',
    });

    await logAudit(req, 'create', 'User', user._id.toString(), { email });
    res.status(201).json({ success: true, data: { id: user._id, email: user.email } });
  } catch (err) {
    next(err);
  }
}
