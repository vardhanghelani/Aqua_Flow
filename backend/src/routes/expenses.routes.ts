import { Router } from 'express';
import { authenticate, authorizeBusiness } from '../middleware/auth';
import { requireOrganization } from '../middleware/organization';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/phase3.controller';

const router = Router();

router.use(authenticate, requireOrganization, authorizeBusiness());

router.get('/summary', ctrl.expenseSummary);
router.get('/', ctrl.listExpenses);
router.post('/', validate(ctrl.expenseValidation), ctrl.createExpense);
router.delete('/:id', validate(ctrl.idParam), ctrl.deleteExpense);

export default router;
