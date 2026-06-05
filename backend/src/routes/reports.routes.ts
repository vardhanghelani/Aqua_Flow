import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as reportsService from '../services/reports.service';

const router = Router();

router.use(authenticate, authorize('owner'));

router.get('/customers', async (_req, res, next) => {
  try {
    const data = await reportsService.getCustomerReports();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/areas', async (_req, res, next) => {
  try {
    const data = await reportsService.getAreaReports();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/drivers', async (_req, res, next) => {
  try {
    const data = await reportsService.getDriverReports();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/payments', async (req, res, next) => {
  try {
    const data = await reportsService.getPaymentReports(
      req.query.from as string,
      req.query.to as string
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/inventory', async (_req, res, next) => {
  try {
    const data = await reportsService.getInventoryReports();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
