import { AuthRequest } from '../types';
import { ApiError } from './apiError';

/** Drivers may only act as themselves; owners may specify driverId. */
export function resolveDriverId(req: AuthRequest, bodyDriverId?: string): string {
  if (req.user!.role === 'driver') {
    if (!req.user!.driverId) {
      throw new ApiError(403, 'Driver profile not linked to account');
    }
    if (bodyDriverId && bodyDriverId !== req.user!.driverId) {
      throw new ApiError(403, 'Cannot act on behalf of another driver');
    }
    return req.user!.driverId;
  }
  if (!bodyDriverId) {
    throw new ApiError(400, 'driverId is required');
  }
  return bodyDriverId;
}
