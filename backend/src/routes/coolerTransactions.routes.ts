import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorizeBusiness } from '../middleware/auth';
import { requireOrganization } from '../middleware/organization';
import { validate } from '../middleware/validate';
import * as coolerService from '../services/coolerTransaction.service';
import { logAudit } from '../middleware/audit';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate, requireOrganization);

router.get('/', authorizeBusiness(), async (req: AuthRequest, res, next) => {
  try {
    const data = await coolerService.listCoolerTransactions({
      organizationId: req.user!.organizationId!,
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

router.get('/summary', authorizeBusiness(), async (req: AuthRequest, res, next) => {
  try {
    const data = await coolerService.getCoolerSummary(req.user!.organizationId!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authorizeBusiness(),
  validate([
    body('customerId').notEmpty(),
    body('type').isIn(['delivered', 'returned', 'damaged', 'lost', 'replaced', 'adjustment']),
    body('quantity').isInt({ min: 1 }),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const txn = await coolerService.createCoolerTransaction({
        ...req.body,
        organizationId: req.user!.organizationId!,
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
