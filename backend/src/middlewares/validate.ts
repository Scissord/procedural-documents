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
      const cleanedErrors = errors
        .array()
        // @ts-expect-error because of express-validator
        .map(({ msg, path, location, type }) => ({
          msg,
          path,
          location,
          type,
        }));

      res.status(400).json({ errors: cleanedErrors });
      return;
    }

    next();
  };
};
