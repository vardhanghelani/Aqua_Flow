import { Router } from 'express';
import { authenticate, authorizeBusiness } from '../middleware/auth';
import { requireOrganization } from '../middleware/organization';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/master.controller';
import * as p3 from '../controllers/phase3.controller';

const router = Router();

router.use(authenticate, requireOrganization);

router.get('/', authorizeBusiness(), ctrl.listCustomers);
router.get('/:id/360', validate(ctrl.idParam), authorizeBusiness(), p3.getCustomer360);
router.get('/:id/credit', validate(ctrl.idParam), authorizeBusiness(), p3.getCustomerCredit);
router.put('/:id/credit', validate(ctrl.idParam), authorizeBusiness(), validate(p3.creditValidation), p3.updateCustomerCredit);
router.get('/:id/analytics', validate(ctrl.idParam), authorizeBusiness(), ctrl.getCustomerAnalytics);
router.get('/:id', validate(ctrl.idParam), authorizeBusiness(), ctrl.getCustomerById);
router.post('/', authorizeBusiness(), validate(ctrl.customerValidation), ctrl.createCustomer);
router.put('/:id', authorizeBusiness(), validate(ctrl.idParam), ctrl.updateCustomer);
router.delete('/:id', authorizeBusiness(), validate(ctrl.idParam), ctrl.deleteCustomer);

export default router;
