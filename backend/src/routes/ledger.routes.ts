import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as ledgerService from '../services/ledger.service';
import { Customer } from '../models';
import PDFDocument from 'pdfkit';

const router = Router();

router.use(authenticate, authorize('owner'));

router.get(
  '/:customerId',
  validate([param('customerId').isMongoId()]),
  async (req, res, next) => {
    try {
      const data = await ledgerService.getCustomerLedger(req.params.customerId, {
        from: req.query.from as string,
        to: req.query.to as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 200,
      });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:customerId/pdf',
  validate([param('customerId').isMongoId()]),
  async (req, res, next) => {
    try {
      const { customer, items } = await ledgerService.getCustomerLedger(req.params.customerId, {
        from: req.query.from as string,
        to: req.query.to as string,
        limit: 500,
      });

      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="ledger-${req.params.customerId}.pdf"`);
      doc.pipe(res);

      doc.fontSize(18).text('Customer Ledger', { align: 'center' });
      doc.fontSize(12).text(`${(customer as { shopName?: string })?.shopName ?? ''}`, { align: 'center' });
      doc.moveDown();

      items.forEach((entry) => {
        doc.fontSize(9).text(
          `${entry.date.toLocaleDateString('en-IN')} | ${entry.particular} | Dr: ${entry.debit} | Cr: ${entry.credit} | Bal: ${entry.balance}`
        );
      });

      doc.end();
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:customerId/csv',
  validate([param('customerId').isMongoId()]),
  async (req, res, next) => {
    try {
      const { customer, items } = await ledgerService.getCustomerLedger(req.params.customerId, {
        from: req.query.from as string,
        to: req.query.to as string,
        limit: 1000,
      });

      const rows = [
        'Date,Particular,Debit,Credit,Balance',
        ...items.map(
          (e) =>
            `${e.date.toISOString().split('T')[0]},"${e.particular}",${e.debit},${e.credit},${e.balance}`
        ),
      ];

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="ledger-${(customer as { shopName?: string })?.shopName ?? 'customer'}.csv"`);
      res.send(rows.join('\n'));
    } catch (err) {
      next(err);
    }
  }
);

export default router;
