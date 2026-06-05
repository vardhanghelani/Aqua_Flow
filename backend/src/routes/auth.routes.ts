import { Router } from 'express';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/login', validate(authController.loginValidation), authController.login); // rate-limited in index.ts
router.post('/register', validate(authController.registerOwnerValidation), authController.registerOwner);
router.get('/me', authenticate, authController.me);

export default router;
