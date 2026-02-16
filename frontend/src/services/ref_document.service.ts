import { IResponse } from '@/interfaces';
import { BASE_URL } from '@/utils';

export const RefDocumentService = {
  async get(filters: {
    classification_id: number;
    stage_id: number;
    role_id: number;
  }): Promise<IResponse> {
    const params = new URLSearchParams({
      classification_id: String(filters.classification_id),
      stage_id: String(filters.stage_id),
      role_id: String(filters.role_id),
    });

    const response = await fetch(`${BASE_URL}/ref-documents?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const result: IResponse = await response.json();

    return result;
  },

  async getById(id: number): Promise<IResponse> {
    const response = await fetch(`${BASE_URL}/ref-documents/${id}`, {
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
