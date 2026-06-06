import { Router } from 'express';
import { authenticate, authorizeBusiness } from '../middleware/auth';
import { requireOrganization } from '../middleware/organization';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/delivery.controller';

const router = Router();

router.use(authenticate, requireOrganization);

router.get('/today', ctrl.today);
router.get('/summary/today', ctrl.summary);
router.get('/history', ctrl.history);
router.post('/', validate(ctrl.saveDeliveryValidation), ctrl.save);

export default router;
