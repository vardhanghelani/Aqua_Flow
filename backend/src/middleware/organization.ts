import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { ApiError } from '../utils/apiError';

/** Reject authenticated requests without organization context (multi-tenant safety). */
export function requireOrganization(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }
  if (!req.user.organizationId) {
    return next(new ApiError(403, 'Organization context required. Please log in again.'));
  }
  next();
}
