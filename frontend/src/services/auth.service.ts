import {
  IUser,
  IRegistrationInput,
  ILoginInput,
  ILoginOutput,
  IResponse,
} from '@/interfaces';
import { base_url } from '@/utils';
import { useNotificationStore } from '@/store';

const BASE_URL = process.env.NEXT_BACKEND_API_URL!;

export const AuthService = {
  async register(data: IRegistrationInput): Promise<IResponse> {
    const response = await fetch(`${base_url}/auth/register`, {
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

  async login(data: ILoginInput): Promise<IResponse> {
    const response = await fetch(`${base_url}/auth/login`, {
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

  async logout() {},

  async refresh(): Promise<string> {
    const notificationStore = useNotificationStore.getState();

    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        notificationStore.addNotification({
          type: 'destructive',
          title: 'Ошибка обновления токена',
          description:
            data.error || data.message || 'Не удалось обновить токен',
        });
        throw new Error(data.error || data.message || 'Refresh failed');
      }

      return data.accessToken;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Ошибка сети при обновлении токена';
      notificationStore.addNotification({
        type: 'destructive',
        title: 'Ошибка обновления токена',
        description: errorMessage,
      });
      throw error;
    }
  },

  async getProfile(): Promise<IUser | string> {
    const notificationStore = useNotificationStore.getState();
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      const errorMessage = 'Токен доступа не найден';
      notificationStore.addNotification({
        type: 'destructive',
        title: 'Ошибка',
        description: errorMessage,
      });
      return errorMessage;
    }

    try {
      const response = await fetch(`${base_url}/auth/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        let errorMessage = 'Ошибка при получении профиля';

        if (
          result.errors &&
          Array.isArray(result.errors) &&
          result.errors.length > 0
        ) {
          errorMessage = result.errors[0].msg;
        } else if (result.error) {
          errorMessage = result.error;
        } else if (result.message) {
          errorMessage = result.message;
        }

        notificationStore.addNotification({
          type: 'destructive',
          title: 'Ошибка',
          description: errorMessage,
        });

        return errorMessage;
      }

      return result.user;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Ошибка сети при получении профиля';
      notificationStore.addNotification({
        type: 'destructive',
        title: 'Ошибка',
        description: errorMessage,
      });
      return errorMessage;
    }
  },

  async updateProfile(data: { phone?: string }): Promise<IUser | string> {
    const notificationStore = useNotificationStore.getState();
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      const errorMessage = 'Токен доступа не найден';
      notificationStore.addNotification({
        type: 'destructive',
        title: 'Ошибка',
        description: errorMessage,
      });
      return errorMessage;
    }

    try {
      const response = await fetch(`${base_url}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        let errorMessage = 'Ошибка при обновлении профиля';

        if (
          result.errors &&
          Array.isArray(result.errors) &&
          result.errors.length > 0
        ) {
          errorMessage = result.errors[0].msg;
        } else if (result.error) {
          errorMessage = result.error;
        } else if (result.message) {
          errorMessage = result.message;
        }

        notificationStore.addNotification({
          type: 'destructive',
          title: 'Ошибка',
          description: errorMessage,
        });

        return errorMessage;
      }

      return result.user;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Ошибка сети при обновлении профиля';
      notificationStore.addNotification({
        type: 'destructive',
        title: 'Ошибка',
        description: errorMessage,
      });
      return errorMessage;
    }
  },
};
