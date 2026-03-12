import { IResponse } from '@/interfaces';
import { BASE_URL } from '@/utils';

export const AppDocumentService = {
  async create(data: { fields: Record<string, any> }): Promise<IResponse> {
    const response = await fetch(`${BASE_URL}/app-documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const result: IResponse = await response.json();

    return result;
  },

  async get(): Promise<IResponse> {
    const response = await fetch(`${BASE_URL}/app-documents`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const result: IResponse = await response.json();

    return result;
  },

  async getChronology(id: string): Promise<IResponse> {
    const response = await fetch(`${BASE_URL}/app-documents/${id}/chronology`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const result: IResponse = await response.json();

    return result;
  },

  async uploadAppeal(file: File, case_id: string): Promise<IResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('case_id', case_id);

    const response = await fetch(`${BASE_URL}/app-documents/appeal`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const result: IResponse = await response.json();

    return result;
  },
};
