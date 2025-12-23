import axios, { AxiosError } from 'axios';
import { useUserStore, useNotificationStore } from '@/store';
import { useRefresh } from '@/api';

export const baseUrl = 'localhost:8080/api';

export const api = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

function isAxiosError<T = any>(error: unknown): error is AxiosError<T> {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error;
}

export const setup = () => {
  const { user, logout } = useUserStore.getState();
  const notificationStore = useNotificationStore.getState();

  api.interceptors.request.use(
    (config) => {
      if (user?.access_token) {
        config.headers['Authorization'] = `Bearer ${user.access_token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // 1. 400 - mean default error need to show to client
      if (error.response.status === 400) {
        notificationStore.addNotification({
          type: 'default',
          title: 'Успех!',
          description: 'Пользователь успешно сохранён.',
        });
      }
      // 2. 401 - token expired
      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        // 3. try to refresh accessToken;
        try {
          const data = await useRefresh();

          // 4. send again original request
          originalRequest.headers[
            'Authorization'
          ] = `Bearer ${data.accessToken}`;

          return api(originalRequest);
        } catch (refreshError: unknown) {
          // 5. catch if refreshToken is expired throw away user from app
          if (
            isAxiosError(refreshError) &&
            refreshError.response?.status === 402
          ) {
            logout();
            notificationStore.addNotification({
              type: 'default',
              title: 'Сессия истекла',
              description: 'Пожалуйста, войдите снова.',
            });
          }

          return Promise.reject(refreshError);
        }
      }
      // 6. 402 - throw away user from app
      if (error.response.status === 402) {
        logout();
        notificationStore.addNotification({
          type: 'default',
          title: 'Успех!',
          description: 'Пользователь успешно сохранён.',
        });
      }
      // 7. 500 - internal server
      if (error.response.status === 500) {
        notificationStore.addNotification({
          type: 'default',
          title: 'Успех!',
          description: 'Пользователь успешно сохранён.',
        });
      }

      // Прочие ошибки
      return Promise.reject(error);
    },
  );
};
