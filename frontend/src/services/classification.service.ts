import { base_url } from '@/utils';
import { IBaseResponse, IClassification } from '@/interfaces';
import { api } from '@/lib/api/fetch.client';

export const ClassificationService = {
  async get() {
    const response = await api('/classifications');
    return response;
  },
};
