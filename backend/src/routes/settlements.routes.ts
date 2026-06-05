import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/phase3.controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize('owner'), ctrl.listSettlements);
router.get('/:id', validate(ctrl.idParam), authorize('owner'), ctrl.getSettlement);
router.post('/', validate(ctrl.settlementValidation), ctrl.upsertSettlement);
router.patch('/:id/submit', validate(ctrl.idParam), ctrl.submitSettlement);
router.patch('/:id/approve', validate(ctrl.idParam), authorize('owner'), ctrl.approveSettlement);
router.patch('/:id/reject', validate(ctrl.idParam), authorize('owner'), ctrl.rejectSettlement);

export default router;
