import { db } from '@services';
import { body } from 'express-validator';

export const registrationValidation = [
  body('email')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail()
    .bail()
    .custom(async (value) => {
      const query = `
        SELECT 1
        FROM auth."user"
        WHERE email_hash = encode(digest(upper($1), 'sha256'), 'hex')
        LIMIT 1
      `;
      const { rows } = await db.query(query, [value]);

      if (rows.length) {
        throw new Error('Данная почта уже зарегестрирована');
      }

      return true;
    }),
  body('first_name')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('First name must be between 1 and 255 characters'),
  body('password')
    .isLength({ min: 3 })
    .withMessage('Password must be at least 3 characters long')
    .matches(/[A-Z]/)
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

// body('email')
//   .optional()
//   .isEmail()
//   .withMessage('email must be valid')
