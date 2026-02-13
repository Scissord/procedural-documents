/**
 * Данный файл возвращает только функцию api(), через которую кидается запросы в бэкэнд
 * Бизнес логика данного файла:
 * Предназначен для клиентских компонентов
 * Является неким middleware, для того чтобы, проверять ошибки при истечении срока токена
 * Если токен истек, то он автоматически перезаписывается и переотправляется запрос
 */
'use client';

const BASE_URL = 'http://localhost:3001/api';

import { useUserStore, useNotificationStore } from '@/store';
import { useRouter } from 'next/navigation';
import type { IResponse } from '@/interfaces';

export async function api(path: string, options?: any, retry = false): Promise<IResponse> {
  const router = useRouter();
  const { logout } = useUserStore.getState(); // только для очистки user
  const notificationStore = useNotificationStore.getState();

  const headers = new Headers(options?.headers ?? {});
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include', // отправка httpOnly cookie
  });

  const result = await response.json();

  // Если всё ок
  if (result.code === 'OK') {
    return result;
  }

  // Если срок действия access токена истёк
  if (result.code === 'ACCESS_EXPIRED' && !retry) {
    // Браузер сам обновляет токен через cookie, можно повторить запрос
    return api(path, options, true);
  }

  // Если refresh токен истёк — logout
  if (result.code === 'REFRESH_EXPIRED') {
    logout();
    router.push('/');
    return result;
  }

  // Для остальных ошибок показываем уведомление
  notificationStore.addNotification({
    type: 'destructive',
    title: 'Ошибка!',
    description: result.message || 'Произошла ошибка при запросе',
  });

  throw new Error(result.message || 'Ошибка запроса');
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

