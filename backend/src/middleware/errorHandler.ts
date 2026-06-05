import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }
  if (err.name === 'ValidationError') {
    res.status(400).json({ success: false, message: err.message });
    return;
  }
  if ((err as { code?: number }).code === 11000) {
    res.status(409).json({ success: false, message: 'Duplicate record' });
    return;
  }
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
}
