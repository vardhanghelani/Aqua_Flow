import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/phase3.controller';

const router = Router();

router.use(authenticate, authorize('owner'));

router.get('/summary', ctrl.expenseSummary);
router.get('/', ctrl.listExpenses);
router.post('/', validate(ctrl.expenseValidation), ctrl.createExpense);
router.delete('/:id', validate(ctrl.idParam), ctrl.deleteExpense);

export default router;
