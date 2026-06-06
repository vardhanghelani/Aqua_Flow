import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorizeBusiness } from '../middleware/auth';
import { requireOrganization } from '../middleware/organization';
import { validate } from '../middleware/validate';
import * as inventoryService from '../services/inventory.service';
import { logAudit } from '../middleware/audit';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate, requireOrganization, authorizeBusiness());

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const data = await inventoryService.getInventorySnapshot(req.user!.organizationId!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/reconcile', async (req: AuthRequest, res, next) => {
  try {
    const data = await inventoryService.reconcileInventory(req.user!.organizationId!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/transactions', async (req: AuthRequest, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const data = await inventoryService.listInventoryTransactions(req.user!.organizationId!, page);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.put(
  '/settings',
  validate([
    body('totalCoolersOwned').optional().isInt({ min: 0 }),
    body('warehouseStock').optional().isInt({ min: 0 }),
    body('inTransit').optional().isInt({ min: 0 }),
    body('inCirculation').optional().isInt({ min: 0 }),
    body('damagedStock').optional().isInt({ min: 0 }),
    body('lostStock').optional().isInt({ min: 0 }),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const data = await inventoryService.updateSettings(req.user!.organizationId!, req.body, req.user!.id);
      await logAudit(req, 'update', 'InventorySettings', undefined, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/adjust',
  validate([
    body('filledOut').isInt({ min: 0 }),
    body('emptyIn').isInt({ min: 0 }),
    body('notes').optional().isString(),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const data = await inventoryService.adjustInventory(
        req.user!.organizationId!,
        req.body.filledOut,
        req.body.emptyIn,
        req.body.notes || 'Manual adjustment',
        req.user!.id
      );
      await logAudit(req, 'create', 'InventoryTransaction', undefined, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
  }
  }
);

export default router;
