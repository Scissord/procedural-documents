import { Request, Response } from 'express';
import { ClassificationService } from '@services';
import { logger } from '@services';
import { normalizeError } from '@helpers';

export const ClassificationController = {
  async get(req: Request, res: Response): Promise<void> {
    try {
      const result = await ClassificationService.get();

      res.status(200).json(result);
    } catch (error: unknown) {
      const message = normalizeError(error);
      logger.info(message);
      res.status(500).send({ error: message });
      return;
    }
  },
};
