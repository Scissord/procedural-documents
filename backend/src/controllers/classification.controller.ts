import { Request, Response } from 'express';
import { ClassificationService } from '@services';
import { logger } from '@services';
import { normalizeError } from '@helpers';
import { RESPONSE_CODE, RESPONSE_STATUS } from '@data';

export const ClassificationController = {
  async get(req: Request, res: Response): Promise<void> {
    try {
      const classifications = await ClassificationService.get();

      res.status(RESPONSE_STATUS.OK).json({
        code: RESPONSE_CODE.OK,
        classifications,
      });
    } catch (error: unknown) {
      const message = normalizeError(error);
      logger.info(message);
      res.status(500).send({ error: message });
      return;
    }
  },
};
