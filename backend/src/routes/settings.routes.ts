import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorizeBusiness } from '../middleware/auth';
import { requireOrganization } from '../middleware/organization';
import { validate } from '../middleware/validate';
import {
  getAnalyticsSettings,
  updateAnalyticsSettings,
  refreshAllCustomerAnalytics,
} from '../services/customerAnalytics.service';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate, requireOrganization, authorizeBusiness());

router.get('/analytics-rules', async (req: AuthRequest, res, next) => {
  try {
    const data = await getAnalyticsSettings(req.user!.organizationId!);
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
      const orgId = req.user!.organizationId!;
      const data = await updateAnalyticsSettings(orgId, req.body);
      await refreshAllCustomerAnalytics(orgId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
