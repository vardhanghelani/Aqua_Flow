import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as pricingService from '../services/pricing.service';
import { logAudit } from '../middleware/audit';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate);

router.get('/current', async (_req, res, next) => {
  try {
    const price = await pricingService.getCurrentPrice();
    res.json({ success: true, data: { price } });
  } catch (err) {
    next(err);
  }
});

router.get('/history', authorize('owner'), async (_req, res, next) => {
  try {
    const data = await pricingService.getPriceHistory();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authorize('owner'),
  validate([body('price').isFloat({ min: 0 })]),
  async (req: AuthRequest, res, next) => {
    try {
      await pricingService.setNewPrice(req.body.price, req.user!.id);
      await logAudit(req, 'create', 'PriceHistory', undefined, { price: req.body.price });
      res.json({ success: true, data: { price: req.body.price } });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
