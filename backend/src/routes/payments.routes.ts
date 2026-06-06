import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorizeBusiness } from '../middleware/auth';
import { requireOrganization } from '../middleware/organization';
import { validate } from '../middleware/validate';
import * as paymentService from '../services/payment.service';
import { logAudit } from '../middleware/audit';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate, requireOrganization, authorizeBusiness());

router.get('/summary', async (req: AuthRequest, res, next) => {
  try {
    const data = await paymentService.getPaymentSummary(req.user!.organizationId!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const data = await paymentService.listPayments({
      organizationId: req.user!.organizationId!,
      customerId: req.query.customerId as string,
      invoiceId: req.query.invoiceId as string,
      from: req.query.from as string,
      to: req.query.to as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  validate([
    body('invoiceId').notEmpty(),
    body('amount').isFloat({ min: 0.01 }),
    body('paymentMethod').isIn(['cash', 'upi', 'bank', 'cheque', 'other']),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const payment = await paymentService.recordPayment({
        ...req.body,
        organizationId: req.user!.organizationId!,
        userId: req.user!.id,
      });
      await logAudit(req, 'create', 'Payment', payment._id.toString(), req.body);
      res.status(201).json({ success: true, data: payment });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
