import { Router } from 'express';
import { authenticate, authorizeBusiness } from '../middleware/auth';
import { requireOrganization } from '../middleware/organization';
import { AuthRequest } from '../types';
import * as dashboardService from '../services/dashboard.service';
import * as notificationsService from '../services/notifications.service';
import * as operationalDashboard from '../services/operationalDashboard.service';

const router = Router();

router.use(authenticate, requireOrganization, authorizeBusiness());

router.get('/operational', async (req: AuthRequest, res, next) => {
  try {
    const data = await operationalDashboard.getOperationalDashboard(req.user!.organizationId!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/sales', async (req: AuthRequest, res, next) => {
  try {
    const data = await dashboardService.getSalesOverview(req.user!.organizationId!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/charts/revenue-trend', async (req: AuthRequest, res, next) => {
  try {
    const months = req.query.months ? parseInt(req.query.months as string) : 6;
    const data = await dashboardService.getRevenueTrend(req.user!.organizationId!, months);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/top-customers', async (req: AuthRequest, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const data = await dashboardService.getTopCustomers(req.user!.organizationId!, limit);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/area-sales', async (req: AuthRequest, res, next) => {
  try {
    const data = await dashboardService.getAreaWiseSales(req.user!.organizationId!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/driver-sales', async (req: AuthRequest, res, next) => {
  try {
    const data = await dashboardService.getDriverWiseSales(req.user!.organizationId!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/alerts', async (req: AuthRequest, res, next) => {
  try {
    const data = await notificationsService.getAlerts(req.user!.organizationId!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
