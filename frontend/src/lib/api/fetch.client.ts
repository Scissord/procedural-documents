/**
 * Данный файл возвращает только функцию api(), через которую кидается запросы в бэкэнд
 * Бизнес логика данного файла:
 * Предназначен для клиентских компонентов
 * Является неким middleware, для того чтобы, проверять ошибки при истечении срока токена
 * Если токен истек, то он автоматически перезаписывается и переотправляется запрос
 */
'use client';

const BASE_URL = process.env.NEXT_BACKEND_API_URL!;

import { useUserStore, useNotificationStore } from '@/store';
import { AuthService } from '@/services';

type ApiFetchOptions = RequestInit & {
  retry?: boolean;
};

export async function api<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { user, setUser, access_token, setAccessToken, logout } =
    useUserStore.getState();
  const notificationStore = useNotificationStore.getState();

  const headers = new Headers(options.headers);

  if (access_token) {
    headers.set('Authorization', `Bearer ${access_token}`);
  }

  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.ok) {
    return response.json();
  }

  // Если от бэка 400
  if (response.status === 400) {
    notificationStore.addNotification({
      type: 'destructive',
      title: 'Ошибка при выполнении запроса',
      description: 'Попробуйте позже',
    });
  }

  // Если от бека 500
  if (response.status === 500) {
    notificationStore.addNotification({
      type: 'destructive',
      title: 'Ошибка сервера',
      description: 'Попробуйте позже',
    });
  }

  // Если от бека 401 - Unauthorized
  if (response.status === 401 && !options.retry) {
    try {
      const newAccessToken = await AuthService.refresh();
      setAccessToken(newAccessToken);

      return api(path, {
        ...options,
        retry: true,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newAccessToken}`,
        },
      });
    } catch {
      logout();
      notificationStore.addNotification({
        type: 'destructive',
        title: 'Сессия истекла',
        description: 'Войдите заново',
      });
      throw response;
    }
  }

  // if 402 - session.expired -> logout

  throw response;
}
