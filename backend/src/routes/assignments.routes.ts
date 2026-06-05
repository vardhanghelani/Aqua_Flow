import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/assignment.controller';

const router = Router();

router.use(authenticate);

router.get('/active', authorize('owner'), ctrl.active);
router.get('/', authorize('owner'), ctrl.list);
router.post('/', authorize('owner'), validate(ctrl.assignValidation), ctrl.assign);

export default router;
