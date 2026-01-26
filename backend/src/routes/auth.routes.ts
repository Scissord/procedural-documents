import { Router } from 'express';
import { AuthController } from '@controllers';
import { validate } from '@middlewares';
import { registrationValidation, loginValidation } from '@validations';
import { auth } from '@middlewares';

const router = Router();

router.post(
  '/registration',
  validate(registrationValidation),
  AuthController.registration,
);

router.post('/login', validate(loginValidation), AuthController.login);
router.post(
  '/logout',
  // auth,
  AuthController.logout,
);
router.post('/refresh', AuthController.refresh);
router.get('/profile', auth, AuthController.getProfile);
router.patch('/profile', auth, AuthController.updateProfile);
export default router;
