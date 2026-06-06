import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { AuthRequest } from '../types';
import { ApiError } from '../utils/apiError';
import * as deliveryService from '../services/delivery.service';
import { logAudit } from '../middleware/audit';

export const saveDeliveryValidation = [
  body('customerId').notEmpty(),
  body('status').isIn(['delivered', 'not_delivered']),
  body('filledGiven').optional().isInt({ min: 0 }),
  body('emptyReturned').optional().isInt({ min: 0 }),
];

export async function save(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const driverId = req.user!.role === 'driver' ? req.user!.driverId : req.body.driverId;
    if (!driverId) throw new ApiError(400, 'Driver ID required');

    const result = await deliveryService.saveDelivery({
      customerId: req.body.customerId,
      driverId,
      userId: req.user!.id,
      deliveryDate: req.body.deliveryDate,
      status: req.body.status,
      filledGiven: req.body.filledGiven,
      emptyReturned: req.body.emptyReturned,
      remarks: req.body.remarks,
    });

    await logAudit(
      req,
      result.isUpdate ? 'update' : 'create',
      'Delivery',
      result.delivery._id.toString(),
      req.body
    );
    res.json({ success: true, data: result.delivery });
  } catch (err) {
    next(err);
  }
}

export async function today(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const driverId = req.user!.role === 'driver' ? req.user!.driverId : (req.query.driverId as string);
    if (!driverId) throw new ApiError(400, 'Driver ID required');

    const data = await deliveryService.getTodayDeliveriesForDriver(
      driverId,
      req.query.date ? new Date(req.query.date as string) : undefined
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function summary(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const driverId = req.user!.role === 'driver' ? req.user!.driverId : (req.query.driverId as string);
    if (!driverId) throw new ApiError(400, 'Driver ID required');

    const data = await deliveryService.getTodaySummary(
      driverId,
      req.query.date ? new Date(req.query.date as string) : undefined
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function history(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const filters: Parameters<typeof deliveryService.getDeliveryHistory>[0] = {
      organizationId: req.user!.organizationId!,
      customerId: req.query.customerId as string,
      driverId: req.user!.role === 'driver' ? req.user!.driverId : (req.query.driverId as string),
      areaId: req.query.areaId as string,
      from: req.query.from as string,
      to: req.query.to as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
    };

    const data = await deliveryService.getDeliveryHistory(filters);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
