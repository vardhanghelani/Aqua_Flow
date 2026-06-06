import { Router } from 'express';
import { authenticate, authorizeBusiness } from '../middleware/auth';
import { requireOrganization } from '../middleware/organization';
import * as ctrl from '../controllers/phase3.controller';

const router = Router();

router.use(authenticate, requireOrganization, authorizeBusiness());

router.get('/export', ctrl.exportBackup);
router.get('/docs', ctrl.backupDocs);

export default router;
