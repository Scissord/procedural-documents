import { api } from '@/api';
import { IUser } from '@/interfaces';

interface LoginResult {
  user: IUser | null;
  accessToken: string | null;
}

export const useLogout = async (data: IUser): Promise<LoginResult> => {
  try {
    const response = await api.post('/auth/logout', data);

    return {
      user: response.data.user,
      accessToken: response.data.accessToken,
    };
  } catch (error: any) {
    return {
      user: null,
      accessToken: null,
    };
  }
};
