import { logger } from '@services';
import { normalizeError } from '@helpers';
import { ClassificationRepository } from '@repositories';
import { IClassification } from '@interfaces';

export const ClassificationService = {
  async get(): Promise<{ classifications: IClassification[] | null }> {
    try {
      const classifications = await ClassificationRepository.get();
      return { classifications };
    } catch (error: unknown) {
      const message = normalizeError(error);
      logger.error(`Registration failed ${message}`);
      throw error;
    }
  },
};
