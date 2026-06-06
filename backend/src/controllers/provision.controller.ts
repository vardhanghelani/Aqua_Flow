import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { AuthRequest } from '../types';
import { ApiError } from '../utils/apiError';
import { provisionNewBusiness } from '../services/organization.service';

export const provisionValidation = [
  body('provisionSecret').notEmpty().withMessage('Provision secret required'),
  body('businessName').notEmpty().withMessage('Business name required'),
  body('ownerName').notEmpty().withMessage('Owner name required'),
  body('loginId').notEmpty().withMessage('Login ID required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export async function provisionBusiness(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const expected = process.env.PROVISION_SECRET?.trim();
    if (!expected) {
      throw new ApiError(503, 'Business provisioning is not configured (PROVISION_SECRET missing)');
    }

    const { provisionSecret, businessName, ownerName, loginId, password } = req.body;
    if (provisionSecret !== expected) {
      throw new ApiError(403, 'Invalid provision secret');
    }

    const result = await provisionNewBusiness({ businessName, ownerName, loginId, password });

    res.status(201).json({
      success: true,
      data: {
        message: 'New business created. Login with the owner credentials — data is fully isolated.',
        organization: result.organization,
        owner: result.owner,
      },
    });
  } catch (err) {
    next(err);
  }
}
