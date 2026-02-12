import { base_url } from '@/utils';
import { IResponse } from '@/interfaces';
import { api } from '@/lib/api/fetch.client';

export const ClassificationService = {
  async get(): Promise<IResponse> {
    const response = await fetch(`${base_url}/classifications`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const result: IResponse = await response.json();

    return result;
  },
};
