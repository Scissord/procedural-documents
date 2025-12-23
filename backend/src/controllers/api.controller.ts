import { logger } from '@services';
import { normalizeError } from '@helpers';
import { Request, Response } from 'express';
/**
 * Контроллер
 */
export const ApiController = {
  async test(req: Request, res: Response): Promise<void> {
    try {
      let arr = [1, 2, 3];

      res.status(200).send(arr);
    } catch (error: unknown) {
      const message = normalizeError(error);
      logger.error(message);
      res.status(500).send({ msg: 'Internal Server Error' });
      return;
    }
  },
};
