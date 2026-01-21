import { Router } from 'express';
import { AuthController } from '@controllers';
import { validate } from '@middlewares';
import { registrationValidation, loginValidation } from '@validations';

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

export default router;
