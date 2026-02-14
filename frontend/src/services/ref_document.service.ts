import { IResponse } from '@/interfaces';
import { BASE_URL } from '@/utils';

export const AppDocumentService = {
  async get(): Promise<IResponse> {
    const response = await fetch(`${BASE_URL}/ref/documents`, {
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
