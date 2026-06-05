import { Response, NextFunction } from 'express';
import { body, param, query } from 'express-validator';
import { AuthRequest } from '../types';
import { ApiError } from '../utils/apiError';
import { logAudit } from '../middleware/audit';
import * as settlementService from '../services/settlement.service';
import * as collectionService from '../services/collection.service';
import * as expenseService from '../services/expense.service';
import * as creditService from '../services/credit.service';
import * as driverPerformanceService from '../services/driverPerformance.service';
import * as customer360Service from '../services/customer360.service';
import * as backupService from '../services/backup.service';
import { resolveDriverId } from '../utils/driverAuth';

export const idParam = [param('id').isMongoId()];

// Settlements
export const settlementValidation = [
  body('settlementDate').notEmpty(),
  body('driverId').optional().isMongoId(),
];

export async function upsertSettlement(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const driverId = resolveDriverId(req, req.body.driverId);
    const data = await settlementService.upsertSettlement({ ...req.body, driverId, userId: req.user!.id });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listSettlements(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await settlementService.listSettlements({
      driverId: req.query.driverId as string,
      status: req.query.status as string,
      from: req.query.from as string,
      to: req.query.to as string,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getSettlement(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await settlementService.getSettlementById(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function submitSettlement(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const existing = await settlementService.getSettlementById(req.params.id);
    if (req.user!.role === 'driver') {
      const settlementDriverId = (existing.driverId as { _id?: { toString: () => string } })?._id?.toString?.()
        ?? (existing.driverId as { toString?: () => string })?.toString?.();
      if (settlementDriverId !== req.user!.driverId) {
        throw new ApiError(403, 'Cannot submit another driver\'s settlement');
      }
    }
    const data = await settlementService.submitSettlement(req.params.id, req.user!.id);
    await logAudit(req, 'update', 'DriverDailySettlement', req.params.id, { action: 'submit' });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function approveSettlement(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await settlementService.approveSettlement(req.params.id, req.user!.id);
    await logAudit(req, 'update', 'DriverDailySettlement', req.params.id, { action: 'approve' });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function rejectSettlement(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await settlementService.rejectSettlement(req.params.id, req.user!.id, req.body.reason);
    await logAudit(req, 'update', 'DriverDailySettlement', req.params.id, { action: 'reject', reason: req.body.reason });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// Collections
export const collectionValidation = [
  body('driverId').optional().isMongoId(),
  body('amount').isFloat({ min: 0.01 }),
  body('paymentMethod').isIn(['cash', 'upi', 'cheque', 'bank', 'other']),
];

export async function recordCollection(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const driverId = resolveDriverId(req, req.body.driverId);
    const data = await collectionService.recordCollection({
      ...req.body,
      driverId,
      userId: req.user!.id,
      createPayment: req.body.createPayment ?? !!req.body.invoiceId,
    });
    await logAudit(req, 'create', 'DriverCollection', data._id.toString(), req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listCollections(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await collectionService.listCollections({
      driverId: req.query.driverId as string,
      customerId: req.query.customerId as string,
      reconciled: req.query.reconciled === 'true' ? true : req.query.reconciled === 'false' ? false : undefined,
      from: req.query.from as string,
      to: req.query.to as string,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function reconcileCollection(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await collectionService.reconcileCollection(req.params.id, req.user!.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function collectionReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await collectionService.getCollectionReport({
      from: req.query.from as string,
      to: req.query.to as string,
      driverId: req.query.driverId as string,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// Expenses
export const expenseValidation = [
  body('category').isIn(['diesel', 'salary', 'maintenance', 'office', 'other']),
  body('description').notEmpty(),
  body('amount').isFloat({ min: 0.01 }),
];

export async function createExpense(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await expenseService.createExpense({ ...req.body, userId: req.user!.id });
    await logAudit(req, 'create', 'Expense', data._id.toString(), req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listExpenses(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await expenseService.listExpenses({
      category: req.query.category as string,
      from: req.query.from as string,
      to: req.query.to as string,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function expenseSummary(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await expenseService.getExpenseSummary({
      from: req.query.from as string,
      to: req.query.to as string,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function deleteExpense(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await expenseService.deleteExpense(req.params.id);
    await logAudit(req, 'delete', 'Expense', req.params.id);
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    next(err);
  }
}

// Credit
export const creditValidation = [
  body('creditLimit').optional().isFloat({ min: 0 }),
  body('creditOverride').optional({ nullable: true }),
];

export async function getCustomerCredit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await creditService.getCustomerCredit(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateCustomerCredit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await creditService.updateCustomerCredit(req.params.id, {
      ...req.body,
      userId: req.user!.id,
    });
    await logAudit(req, 'update', 'Customer', req.params.id, { credit: req.body });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// Customer 360
export async function getCustomer360(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await customer360Service.getCustomer360(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// Driver performance
export async function getDriverPerformance(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await driverPerformanceService.computeDriverPerformance(req.params.id, {
      from: req.query.from as string,
      to: req.query.to as string,
      month: req.query.month as string,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// Backup
export async function exportBackup(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await backupService.exportDatabase();
    await logAudit(req, 'export', 'Backup', 'full', { collections: Object.keys(data).length });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function backupDocs(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: backupService.RECOVERY_DOCS });
  } catch (err) {
    next(err);
  }
}
