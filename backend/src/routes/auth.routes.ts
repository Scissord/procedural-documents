import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '@controllers';
import { validate } from '@middlewares';

const router = Router();

const registrationValidation = [
  body('email')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail(),
  body('first_name')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('First name must be between 1 and 255 characters'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be one of: male, female, other'),
  body('locale')
    .trim()
    .notEmpty()
    .withMessage('Locale is required')
    .isLength({ min: 2, max: 10 })
    .withMessage('Locale must be between 2 and 10 characters'),
  body('timezone')
    .trim()
    .notEmpty()
    .withMessage('Timezone is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Timezone must be between 1 and 255 characters'),
  body('last_name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Last name must be at most 255 characters'),
  body('middle_name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Middle name must be at most 255 characters'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone must be at most 20 characters'),
  body('birthday')
    .optional()
    .isISO8601()
    .withMessage('Birthday must be a valid date'),
];

/**
 * Валидация для входа
 */
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * Регистрация нового пользователя
 * POST /api/auth/registration
 */
router.post(
  '/registration',
  validate(registrationValidation),
  AuthController.registration,
);

/**
 * Вход пользователя
 * POST /api/auth/login
 */
router.post('/login', validate(loginValidation), AuthController.login);

/**
 * Выход пользователя
 * POST /api/auth/logout
 */
router.post('/logout', AuthController.logout);

/**
 * Обновление access токена
 * POST /api/auth/refresh
 */
router.post('/refresh', AuthController.refresh);

export default router;
