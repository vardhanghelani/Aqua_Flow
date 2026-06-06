import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/master.controller';
import * as p3 from '../controllers/phase3.controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize('owner'), ctrl.listCustomers);
router.get('/:id/360', validate(ctrl.idParam), authorize('owner'), p3.getCustomer360);
router.get('/:id/credit', validate(ctrl.idParam), authorize('owner'), p3.getCustomerCredit);
router.put('/:id/credit', validate(ctrl.idParam), authorize('owner'), validate(p3.creditValidation), p3.updateCustomerCredit);
router.get('/:id/analytics', validate(ctrl.idParam), authorize('owner'), ctrl.getCustomerAnalytics);
router.get('/:id', validate(ctrl.idParam), authorize('owner'), ctrl.getCustomerById);
router.post('/', authorize('owner'), validate(ctrl.customerValidation), ctrl.createCustomer);
router.put('/:id', authorize('owner'), validate(ctrl.idParam), ctrl.updateCustomer);
router.delete('/:id', authorize('owner'), validate(ctrl.idParam), ctrl.deleteCustomer);

export default router;
