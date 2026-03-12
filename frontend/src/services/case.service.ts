import { IResponse } from '@/interfaces';
import { BASE_URL } from '@/utils';

export const CaseService = {
  async get(): Promise<IResponse> {
    const response = await fetch(`${BASE_URL}/cases`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const result: IResponse = await response.json();

    return result;
  },

  async getById(id: string): Promise<IResponse> {
    const response = await fetch(`${BASE_URL}/cases/${id}`, {
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
