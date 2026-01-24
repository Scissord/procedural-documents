import { logger } from '@services';
import { normalizeError } from '@helpers';
import { StageRepository } from '@repositories';
import { IStage } from '@interfaces';

export const StageService = {
  async get(classification_id: number): Promise<{ stages: IStage[] | null }> {
    try {
      const stages = await StageRepository.get(classification_id);
      return { stages };
    } catch (error: unknown) {
      const message = normalizeError(error);
      logger.error(`Registration failed ${message}`);
      throw error;
    }
  },
};
