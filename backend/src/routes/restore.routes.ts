import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/restore.controller';

const router = Router();

router.use(authenticate, authorize('owner'));

router.post('/:entity/:id/restore', validate(ctrl.restoreParams), ctrl.restoreEntity);

export default router;
