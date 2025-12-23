import { api } from '@/api';
import { IUser } from '@/interfaces';

interface RegistrationResult {
  user: IUser | null;
  accessToken: string | null;
  errors: { msg: string }[] | null;
}

export const useRefresh = async (): Promise<RegistrationResult> => {
  try {
    const response = await api.post('/auth/refresh');

    return {
      user: response.data.user,
      accessToken: response.data.accessToken,
      errors: null,
    };
  } catch (error: any) {
    return {
      user: null,
      accessToken: null,
      errors: error.response?.data?.errors || [
        { msg: 'Сетевая ошибка или ошибка сервера' },
      ],
    };
  }
};
