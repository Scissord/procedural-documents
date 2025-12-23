// 👉 Клиент (browser, client components)
// 👉 Можно:

// читать Zustand / Redux

// показывать уведомления

// делать refresh по 401

// lib/api/fetch.client.ts
'use client';

import { useUserStore, useNotificationStore } from '@/store';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

type ApiFetchOptions = RequestInit & {
  retry?: boolean;
};

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { user, setAccessToken, logout } = useUserStore.getState();
  const notificationStore = useNotificationStore.getState();

  const headers = new Headers(options.headers);

  if (user?.accessToken) {
    headers.set('Authorization', `Bearer ${user.accessToken}`);
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

  // ---------- errors ----------
  if (response.status === 401 && !options.retry) {
    try {
      const newAccessToken = await refreshToken();
      setAccessToken(newAccessToken);

      return apiFetch(path, {
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
        type: 'error',
        title: 'Сессия истекла',
        description: 'Войдите заново',
      });
      throw response;
    }
  }

  if (response.status === 400) {
    notificationStore.addNotification({
      type: 'error',
      title: 'Ошибка',
      description: 'Некорректные данные',
    });
  }

  if (response.status === 500) {
    notificationStore.addNotification({
      type: 'error',
      title: 'Ошибка сервера',
      description: 'Попробуйте позже',
    });
  }

  throw response;
}

async function refreshToken(): Promise<string> {
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Refresh failed');
  }

  const data = await res.json();
  return data.accessToken;
}
