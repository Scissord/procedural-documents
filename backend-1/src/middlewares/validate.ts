import { RESPONSE_CODE, RESPONSE_STATUS } from '@data';
import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

export const validate = (validations: ValidationChain[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const cleanedErrors = errors.array().map(({ msg }) => ({
        message: msg,
      }));

      if (cleanedErrors[0].message === 'Данная почта уже зарегестрирована') {
        res.status(RESPONSE_STATUS.INVALID_DATA).json({
          error: cleanedErrors[0].message,
          message: 'Email already exists',
          code: RESPONSE_CODE.EMAIL_EXISTS,
        });
        return;
      }

      res.status(RESPONSE_STATUS.INVALID_DATA).json({
        error: cleanedErrors[0].message,
        message: cleanedErrors[0].message || 'Ошибка валидации',
        code: RESPONSE_CODE.VALIDATION_ERROR,
      });
      return;
    }

    next();
  };
};
