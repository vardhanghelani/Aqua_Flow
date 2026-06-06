import { Router } from 'express';
import { param } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, authorizeBusiness } from '../middleware/auth';
import { requireOrganization } from '../middleware/organization';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/login', validate(authController.loginValidation), authController.login);
router.post('/register', validate(authController.registerOwnerValidation), authController.registerOwner);
router.get('/me', authenticate, authController.me);

router.get('/co-owners', authenticate, requireOrganization, authorizeBusiness(), authController.listCoOwnersHandler);
router.post(
  '/co-owners',
  authenticate,
  requireOrganization,
  authorizeBusiness(),
  validate(authController.coOwnerValidation),
  authController.createCoOwnerHandler
);
router.delete(
  '/co-owners/:id',
  authenticate,
  requireOrganization,
  authorizeBusiness(),
  validate([param('id').isMongoId()]),
  authController.removeCoOwnerHandler
);

export default router;
