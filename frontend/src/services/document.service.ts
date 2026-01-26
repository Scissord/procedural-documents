import { IUserDocument } from '@/interfaces';
import { base_url } from '@/utils';

type ApiError = {
  errors?: Array<{ msg: string }>;
  error?: string;
};

export const DocumentService = {
  async getUserDocuments(): Promise<IUserDocument[] | string> {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        return 'Токен доступа не найден';
      }

      const response = await fetch(`${base_url}/auth/documents`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();
      if (!response.ok) {
        if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
          return result.errors[0].msg;
        }
        throw result;
      }

      return result.documents || [];
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr?.errors && Array.isArray(apiErr.errors) && apiErr.errors.length > 0) {
        return apiErr.errors[0].msg;
      }
      if (apiErr?.error) {
        return apiErr.error;
      }
      return 'Произошла ошибка при получении документов';
    }
  },
};
