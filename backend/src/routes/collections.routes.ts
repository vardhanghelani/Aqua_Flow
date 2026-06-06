import { Router } from 'express';
import { authenticate, authorizeBusiness } from '../middleware/auth';
import { requireOrganization } from '../middleware/organization';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/phase3.controller';

const router = Router();

router.use(authenticate, requireOrganization);

router.get('/report', authorizeBusiness(), ctrl.collectionReport);
router.get('/', authorizeBusiness(), ctrl.listCollections);
router.post('/', validate(ctrl.collectionValidation), ctrl.recordCollection);
router.patch('/:id/reconcile', validate(ctrl.idParam), authorizeBusiness(), ctrl.reconcileCollection);

export default router;
