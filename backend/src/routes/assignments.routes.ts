import { Router } from 'express';
import { authenticate, authorizeBusiness } from '../middleware/auth';
import { requireOrganization } from '../middleware/organization';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/assignment.controller';

const router = Router();

router.use(authenticate, requireOrganization);

router.get('/active', authorizeBusiness(), ctrl.active);
router.get('/', authorizeBusiness(), ctrl.list);
router.post('/', authorizeBusiness(), validate(ctrl.assignValidation), ctrl.assign);

export default router;
