import { base_url } from '@/utils';
import { IResponse } from '@/interfaces';

export const StageService = {
  async findByClassificationId(classification_id: number): Promise<IResponse> {
    const response = await fetch(
      `${base_url}/stages/classification/${classification_id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      },
    );

    const result: IResponse = await response.json();

    return result;
  },
};
