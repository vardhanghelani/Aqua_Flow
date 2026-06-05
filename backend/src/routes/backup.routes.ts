import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as ctrl from '../controllers/phase3.controller';

const router = Router();

router.use(authenticate, authorize('owner'));

router.get('/export', ctrl.exportBackup);
router.get('/docs', ctrl.backupDocs);

export default router;
