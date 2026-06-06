import { Router } from 'express';
import { authenticate, authorizeBusiness } from '../middleware/auth';
import { requireOrganization } from '../middleware/organization';
import { AuthRequest } from '../types';
import * as reportsService from '../services/reports.service';

const router = Router();

router.use(authenticate, requireOrganization, authorizeBusiness());

router.get('/customers', async (req: AuthRequest, res, next) => {
  try {
    const data = await reportsService.getCustomerReports(req.user!.organizationId!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/areas', async (req: AuthRequest, res, next) => {
  try {
    const data = await reportsService.getAreaReports(req.user!.organizationId!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/drivers', async (req: AuthRequest, res, next) => {
  try {
    const data = await reportsService.getDriverReports(req.user!.organizationId!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/payments', async (req: AuthRequest, res, next) => {
  try {
    const data = await reportsService.getPaymentReports(
      req.user!.organizationId!,
      req.query.from as string,
      req.query.to as string
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/inventory', async (req: AuthRequest, res, next) => {
  try {
    const data = await reportsService.getInventoryReports(req.user!.organizationId!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
