import { Response, NextFunction } from 'express';
import { param } from 'express-validator';
import { Area, Driver, Customer } from '../models';
import { AuthRequest } from '../types';
import { ApiError } from '../utils/apiError';
import { restoreDoc } from '../utils/softDelete';
import { logAudit } from '../middleware/audit';

const ENTITY_MAP = {
  areas: Area,
  drivers: Driver,
  customers: Customer,
} as const;

export const restoreParams = [
  param('entity').isIn(['areas', 'drivers', 'customers']),
  param('id').isMongoId(),
];

export async function restoreEntity(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const entity = req.params.entity as keyof typeof ENTITY_MAP;
    const id = req.params.id;
    let doc;

    switch (entity) {
      case 'areas':
        doc = await Area.findById(id);
        break;
      case 'drivers':
        doc = await Driver.findById(id);
        break;
      case 'customers':
        doc = await Customer.findById(id);
        break;
      default:
        throw new ApiError(400, 'Invalid entity');
    }

    if (!doc) throw new ApiError(404, `${entity.slice(0, -1)} not found`);
    if (!doc.deletedAt) throw new ApiError(400, 'Entity is not deleted');

    await restoreDoc(doc);
    await logAudit(req, 'restore', entity, id);
    res.json({ success: true, data: doc, message: 'Restored successfully' });
  } catch (err) {
    next(err);
  }
}
