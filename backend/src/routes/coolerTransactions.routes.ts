import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as coolerService from '../services/coolerTransaction.service';
import { logAudit } from '../middleware/audit';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate);

router.get('/', authorize('owner'), async (req, res, next) => {
  try {
    const data = await coolerService.listCoolerTransactions({
      customerId: req.query.customerId as string,
      type: req.query.type as string,
      from: req.query.from as string,
      to: req.query.to as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/summary', authorize('owner'), async (_req, res, next) => {
  try {
    const data = await coolerService.getCoolerSummary();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authorize('owner'),
  validate([
    body('customerId').notEmpty(),
    body('type').isIn(['delivered', 'returned', 'damaged', 'lost', 'replaced', 'adjustment']),
    body('quantity').isInt({ min: 1 }),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const txn = await coolerService.createCoolerTransaction({
        ...req.body,
        userId: req.user!.id,
      });
      await logAudit(req, 'create', 'CoolerTransaction', txn._id.toString(), req.body);
      res.status(201).json({ success: true, data: txn });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
