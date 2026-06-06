import { Router } from 'express';
import { authenticate, authorizeBusiness } from '../middleware/auth';
import { requireOrganization } from '../middleware/organization';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/restore.controller';

const router = Router();

router.use(authenticate, requireOrganization, authorizeBusiness());

router.post('/:entity/:id/restore', validate(ctrl.restoreParams), ctrl.restoreEntity);

export default router;
