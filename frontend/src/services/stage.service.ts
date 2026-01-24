import { base_url } from '@/utils';
import { IStage } from '@/interfaces';

export const StageService = {
  async get(classification_id: string): Promise<IStage[] | string> {
    try {
      const response = await fetch(`${base_url}/stages?classification_id=${encodeURIComponent(classification_id)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (!response.ok) {
        throw result;
      }

      return result.stages;
    } catch (err: unknown) {
      return 'Произошла ошибка при получении стадий';
    }
  },
};
