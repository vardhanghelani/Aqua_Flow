import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/master.controller';
import * as p3 from '../controllers/phase3.controller';

const router = Router();

router.use(authenticate, authorize('owner'));

router.get('/:id/performance', validate(p3.idParam), p3.getDriverPerformance);
router.get('/', ctrl.listDrivers);
router.post('/', validate(ctrl.driverValidation), ctrl.createDriver);
router.put('/:id', validate([...ctrl.idParam, ...ctrl.driverUpdateValidation]), ctrl.updateDriver);
router.delete('/:id', validate(ctrl.idParam), ctrl.deleteDriver);

export default router;
