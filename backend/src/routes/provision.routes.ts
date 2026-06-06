import { Router } from 'express';
import { validate } from '../middleware/validate';
import { provisionRateLimiter } from '../middleware/security';
import * as provisionController from '../controllers/provision.controller';

const router = Router();

/** Secret route — not linked in app UI. Requires PROVISION_SECRET env on server. */
router.post(
  '/business',
  provisionRateLimiter,
  validate(provisionController.provisionValidation),
  provisionController.provisionBusiness
);

export default router;
