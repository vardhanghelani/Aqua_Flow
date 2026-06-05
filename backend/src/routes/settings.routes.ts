import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  getAnalyticsSettings,
  updateAnalyticsSettings,
  refreshAllCustomerAnalytics,
} from '../services/customerAnalytics.service';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate, authorize('owner'));

router.get('/analytics-rules', async (_req, res, next) => {
  try {
    const data = await getAnalyticsSettings();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.put(
  '/analytics-rules',
  validate([
    body('inactiveDaysThreshold').optional().isInt({ min: 1 }),
    body('atRiskDaysThreshold').optional().isInt({ min: 1 }),
    body('excessiveCoolerThreshold').optional().isInt({ min: 1 }),
    body('lowWarehouseThreshold').optional().isInt({ min: 0 }),
    body('unservicedDaysThreshold').optional().isInt({ min: 1 }),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const data = await updateAnalyticsSettings(req.body);
      await refreshAllCustomerAnalytics();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
