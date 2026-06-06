import { Router } from 'express';
import { authenticate, authorizeBusiness } from '../middleware/auth';
import { requireOrganization } from '../middleware/organization';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/master.controller';

const router = Router();

router.use(authenticate, requireOrganization, authorizeBusiness());

router.get('/', ctrl.listAreas);
router.post('/', validate(ctrl.areaValidation), ctrl.createArea);
router.put('/:id', validate([...ctrl.idParam, ...ctrl.areaValidation]), ctrl.updateArea);
router.delete('/:id', validate(ctrl.idParam), ctrl.deleteArea);

export default router;
