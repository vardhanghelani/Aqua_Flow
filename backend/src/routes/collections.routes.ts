import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/phase3.controller';

const router = Router();

router.use(authenticate);

router.get('/report', authorize('owner'), ctrl.collectionReport);
router.get('/', authorize('owner'), ctrl.listCollections);
router.post('/', validate(ctrl.collectionValidation), ctrl.recordCollection);
router.patch('/:id/reconcile', validate(ctrl.idParam), authorize('owner'), ctrl.reconcileCollection);

export default router;
