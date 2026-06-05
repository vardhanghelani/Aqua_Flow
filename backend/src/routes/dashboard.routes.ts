import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as dashboardService from '../services/dashboard.service';
import * as notificationsService from '../services/notifications.service';
import * as operationalDashboard from '../services/operationalDashboard.service';

const router = Router();

router.use(authenticate, authorize('owner'));

router.get('/operational', async (_req, res, next) => {
  try {
    const data = await operationalDashboard.getOperationalDashboard();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/sales', async (_req, res, next) => {
  try {
    const data = await dashboardService.getSalesOverview();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/charts/revenue-trend', async (req, res, next) => {
  try {
    const months = req.query.months ? parseInt(req.query.months as string) : 6;
    const data = await dashboardService.getRevenueTrend(months);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/top-customers', async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const data = await dashboardService.getTopCustomers(limit);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/area-sales', async (_req, res, next) => {
  try {
    const data = await dashboardService.getAreaWiseSales();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/driver-sales', async (_req, res, next) => {
  try {
    const data = await dashboardService.getDriverWiseSales();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/alerts', async (_req, res, next) => {
  try {
    const data = await notificationsService.getAlerts();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
