import { Request, Response } from 'express';
import { StageService } from '@services';
import { logger } from '@services';
import { normalizeError } from '@helpers';

export const StageController = {
  async get(req: Request, res: Response): Promise<void> {
    try {
      const classificationIdRaw = req.query.classification_id;
      const classificationId =
        typeof classificationIdRaw === 'string'
          ? Number(classificationIdRaw)
          : NaN;

      if (!Number.isFinite(classificationId)) {
        res.status(400).json({ error: 'classification_id is required' });
        return;
      }

      const result = await StageService.get(classificationId);

      res.status(200).json(result);
    } catch (error: unknown) {
      const message = normalizeError(error);
      logger.info(message);
      res.status(500).send({ error: message });
      return;
    }
  },
};
