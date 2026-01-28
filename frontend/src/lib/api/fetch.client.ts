/**
 * Данный файл возвращает только функцию api(), через которую кидается запросы в бэкэнд
 * Бизнес логика данного файла:
 * Предназначен для клиентских компонентов
 * Является неким middleware, для того чтобы, проверять ошибки при истечении срока токена
 * Если токен истек, то он автоматически перезаписывается и переотправляется запрос
 */
'use client';

// const BASE_URL = process.env.NEXT_BACKEND_API_URL;
const BASE_URL = 'http://localhost:3001/api';

import { useUserStore, useNotificationStore } from '@/store';
import { AuthService } from '@/services';
import { IBaseResponse } from '@/interfaces';
import { useRouter } from 'next/navigation';

export async function api(path: string, options?: any) {
  const router = useRouter();
  const { access_token, setAccessToken, logout } = useUserStore.getState();
  const notificationStore = useNotificationStore.getState();

  const headers = new Headers(options?.headers ?? {});

  if (access_token) {
    headers.set('Authorization', `Bearer ${access_token}`);
  }

  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const result = await response.json();

  if (result.code === 'OK') {
    return result;
  } else if (result.code === 'ACCESS_EXPIRED') {
    setAccessToken(result.access_token);

    return api(path, {
      ...options,
      retry: true,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${result.access_token}`,
      },
    });
  } else if (result.code === 'REFRESH_EXPIRED') {
    logout();
    router.push('/');
  }

  // Если от бэка 400
  // if (response.status === 400) {
  //   notificationStore.addNotification({
  //     type: 'destructive',
  //     title: 'Ошибка при выполнении запроса',
  //     description: 'Попробуйте позже',
  //   });
  // }

  // Если от бека 500
  // if (response.status === 500) {
  //   notificationStore.addNotification({
  //     type: 'destructive',
  //     title: 'Ошибка сервера',
  //     description: 'Попробуйте позже',
  //   });
  // }

  // Если от бека 401 - Unauthorized
  // if (response.status === 401 && !options.retry) {
  //   try {

  //   } catch {
  //     logout();
  //     notificationStore.addNotification({
  //       type: 'destructive',
  //       title: 'Сессия истекла',
  //       description: 'Войдите заново',
  //     });
  //     throw response;
  //   }
  // }

  // if 402 - session.expired -> logout

  return result;
}
