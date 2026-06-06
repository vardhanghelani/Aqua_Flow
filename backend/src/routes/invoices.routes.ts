import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorizeBusiness } from '../middleware/auth';
import { requireOrganization } from '../middleware/organization';
import { validate } from '../middleware/validate';
import * as invoiceService from '../services/invoice.service';
import { logAudit } from '../middleware/audit';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate, requireOrganization, authorizeBusiness());

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const data = await invoiceService.listInvoices({
      organizationId: req.user!.organizationId!,
      customerId: req.query.customerId as string,
      status: req.query.status as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/generate',
  validate([
    body('customerId').notEmpty(),
    body('periodStart').notEmpty(),
    body('periodEnd').notEmpty(),
    body('invoiceType').isIn(['monthly', 'weekly', 'custom']),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const invoice = await invoiceService.generateInvoice({
        ...req.body,
        organizationId: req.user!.organizationId!,
        userId: req.user!.id,
      });
      await logAudit(req, 'create', 'Invoice', invoice._id.toString(), req.body);
      res.status(201).json({ success: true, data: invoice });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/:id/share', validate([param('id').isMongoId()]), async (req: AuthRequest, res, next) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id, req.user!.organizationId!);
    const data = invoiceService.getInvoiceShareInfo(invoice);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', validate([param('id').isMongoId()]), async (req: AuthRequest, res, next) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id, req.user!.organizationId!);
    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/pdf', validate([param('id').isMongoId()]), async (req: AuthRequest, res, next) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id, req.user!.organizationId!);
    const doc = invoiceService.generateInvoicePdf(invoice);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    doc.pipe(res);
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/:id/void',
  validate([param('id').isMongoId()]),
  async (req: AuthRequest, res, next) => {
    try {
      const invoice = await invoiceService.voidInvoice(req.params.id, req.user!.id, req.user!.organizationId!);
      await logAudit(req, 'update', 'Invoice', invoice._id.toString(), { action: 'void' });
      res.json({ success: true, data: invoice });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
