import { base_url } from '@/utils';
import { IClassification } from '@/interfaces';

export const ClassificationService = {
  async get(): Promise<IClassification[] | string> {
    try {
      const response = await fetch(`${base_url}/classifications`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (!response.ok) {
        throw result;
      }

      return result.classifications;
    } catch (err: unknown) {
      return 'Произошла ошибка при регистрации';
    }
  },
};
