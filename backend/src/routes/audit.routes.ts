import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { AuditLog } from '../models';

const router = Router();

router.use(authenticate, authorize('owner'));

router.get('/', async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (req.query.entityType) query.entityType = req.query.entityType;
    if (req.query.action) query.action = req.query.action;
    if (req.query.from || req.query.to) {
      query.createdAt = {};
      if (req.query.from) (query.createdAt as Record<string, Date>).$gte = new Date(req.query.from as string);
      if (req.query.to) (query.createdAt as Record<string, Date>).$lte = new Date(req.query.to as string);
    }

    const [items, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'name email role')
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
