import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorizeBusiness } from '../middleware/auth';
import { requireOrganization } from '../middleware/organization';
import { validate } from '../middleware/validate';
import * as pricingService from '../services/pricing.service';
import { logAudit } from '../middleware/audit';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate, requireOrganization);

router.get('/current', async (req: AuthRequest, res, next) => {
  try {
    const orgId = req.user!.organizationId!;
    const price = await pricingService.getCurrentPrice(orgId);
    res.json({ success: true, data: { price } });
  } catch (err) {
    next(err);
  }
});

router.get('/history', authorizeBusiness(), async (req: AuthRequest, res, next) => {
  try {
    const data = await pricingService.getPriceHistory(req.user!.organizationId!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authorizeBusiness(),
  validate([body('price').isFloat({ min: 0 })]),
  async (req: AuthRequest, res, next) => {
    try {
      await pricingService.setNewPrice(req.user!.organizationId!, req.body.price, req.user!.id);
      await logAudit(req, 'create', 'PriceHistory', undefined, { price: req.body.price });
      res.json({ success: true, data: { price: req.body.price } });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
