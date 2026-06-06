import { Router } from 'express';
import { authenticate, authorizeBusiness } from '../middleware/auth';
import { requireOrganization } from '../middleware/organization';
import { AuditLog } from '../models';
import { AuthRequest } from '../types';
import { tenantFilter } from '../utils/tenant';

const router = Router();

router.use(authenticate, requireOrganization, authorizeBusiness());

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const skip = (page - 1) * limit;
    const organizationId = req.user!.organizationId!;

    const query: Record<string, unknown> = tenantFilter(organizationId);
    if (req.query.entityType) query.entityType = req.query.entityType;
    if (req.query.action) query.action = req.query.action;
    if (req.query.from || req.query.to) {
      query.createdAt = {};
      if (req.query.from) (query.createdAt as Record<string, Date>).$gte = new Date(req.query.from as string);
      if (req.query.to) (query.createdAt as Record<string, Date>).$lte = new Date(req.query.to as string);
    }

    const [items, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'name loginId role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(query),
    ]);

    res.json({ success: true, data: { items, total, page, limit } });
  } catch (err) {
    next(err);
  }
});

export default router;
