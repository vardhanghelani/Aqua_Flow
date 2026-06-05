import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/delivery.controller';

const router = Router();

router.use(authenticate);

router.get('/today', ctrl.today);
router.get('/summary/today', ctrl.summary);
router.get('/history', ctrl.history);
router.post('/', validate(ctrl.saveDeliveryValidation), ctrl.save);

export default router;
