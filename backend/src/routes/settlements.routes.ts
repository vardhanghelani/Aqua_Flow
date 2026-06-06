import { Router } from 'express';
import { authenticate, authorizeBusiness } from '../middleware/auth';
import { requireOrganization } from '../middleware/organization';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/phase3.controller';

const router = Router();

router.use(authenticate, requireOrganization);

router.get('/', authorizeBusiness(), ctrl.listSettlements);
router.get('/:id', validate(ctrl.idParam), authorizeBusiness(), ctrl.getSettlement);
router.post('/', validate(ctrl.settlementValidation), ctrl.upsertSettlement);
router.patch('/:id/submit', validate(ctrl.idParam), ctrl.submitSettlement);
router.patch('/:id/approve', validate(ctrl.idParam), authorizeBusiness(), ctrl.approveSettlement);
router.patch('/:id/reject', validate(ctrl.idParam), authorizeBusiness(), ctrl.rejectSettlement);

export default router;
